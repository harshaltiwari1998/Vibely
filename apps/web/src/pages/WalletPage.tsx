import { useEffect, useRef, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  reference?: string;
};

type CoinPackage = {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
};

type PaymentStatus = "idle" | "pending" | "processing" | "success" | "failed";

export function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

  const load = async () => {
    setLoading(true);
    try {
      const [balanceRes, txRes, pkgRes] = await Promise.all([
        api.get("/wallet"),
        api.get("/wallet/transactions"),
        api.get("/payments/packages"),
      ]);
      setBalance(balanceRes.data.balance ?? 0);
      setTransactions(txRes.data.items ?? []);
      setPackages(pkgRes.data ?? []);
    } catch {
      setBalance(0);
      setTransactions([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const sock = io(wsUrl, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket"],
    });
    socketRef.current = sock;

    sock.on(RealtimeEvent.PaymentSucceeded, (_payload: { paymentId: string; coins: number }) => {
      setPaymentStatus("success");
      load();
      setTimeout(() => setPaymentStatus("idle"), 3000);
    });

    sock.on(RealtimeEvent.PaymentFailed, (_payload: { paymentId: string; reason?: string }) => {
      setPaymentStatus("failed");
      setTimeout(() => setPaymentStatus("idle"), 3000);
    });

    return () => {
      sock.disconnect();
    };
  }, [accessToken, wsUrl]);

  const initiatePayment = async (pkg: CoinPackage) => {
    setPaymentStatus("pending");
    try {
      const { data } = await api.post("/payments/create", {
        packageId: pkg.id,
        idempotencyKey: `pay_${Date.now()}`,
      });
      setActivePaymentId(data.paymentId);
      setPaymentStatus("processing");

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.qrCode) {
        alert(`Scan QR code to pay: ${data.qrCode}`);
      } else if (data.upiLink) {
        window.location.href = data.upiLink;
      } else {
        alert("Payment initiated. Complete payment in your payment app.");
      }

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/payments/${data.paymentId}/status`);
          const status = statusRes.data.status;
          if (status === "SUCCEEDED" || status === "FAILED" || status === "REFUNDED") {
            clearInterval(pollInterval);
            setPaymentStatus(status === "SUCCEEDED" ? "success" : "failed");
            load();
            setTimeout(() => {
              setPaymentStatus("idle");
              setActivePaymentId(null);
            }, 3000);
          }
        } catch {
          // ignore polling errors
        }
      }, 3000);

      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    } catch {
      setPaymentStatus("failed");
      setTimeout(() => setPaymentStatus("idle"), 3000);
    }
  };

  const getStatusLabel = () => {
    if (paymentStatus === "pending") return "Initiating payment...";
    if (paymentStatus === "processing") return "Processing payment...";
    if (paymentStatus === "success") return "Payment successful! Coins credited.";
    if (paymentStatus === "failed") return "Payment failed. Please try again.";
    return "";
  };

  return (
    <Page title="">
      <div className="-mx-4 -mt-5 bg-gradient-to-r from-[#b13bf0] to-[#9350f5] px-6 py-8 text-center text-white md:mx-0 md:rounded-lg">
        <h1 className="text-2xl font-bold">My Wallet</h1>
        <p className="mt-4 text-sm">Diamond balance: <span className="text-3xl font-black">{balance ?? "—"} 💎</span></p>
      </div>
      <div className="card mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Refresh your balance and packages</p>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {paymentStatus !== "idle" && (
        <div className="card mt-4">
          <p className="text-center text-lg font-semibold">{getStatusLabel()}</p>
          {paymentStatus === "processing" && activePaymentId && (
            <p className="text-center text-sm text-gray-500">Payment ID: {activePaymentId}</p>
          )}
        </div>
      )}

      <div className="card mt-4">
        <h3 className="mb-3 text-lg font-black">Weekly Special Offers</h3>
        {packages.length === 0 && <p className="text-sm text-gray-400">No packages available.</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => initiatePayment(pkg)}
              disabled={paymentStatus === "pending" || paymentStatus === "processing"}
              className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5 hover:ring-[#9350f5]"
            >
              <div className="text-lg font-black">💎 {pkg.coins}</div>
              <div className="mt-2 inline-block rounded-full bg-[#e64aa0] px-3 py-1 text-xs font-bold text-white">₹{pkg.price} {pkg.currency}</div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">Prices are set by the backend. Payments are processed securely via Razorpay.</p>
      </div>

      <div className="card mt-4">
        <h3 className="mb-3 text-lg font-semibold">Transaction History</h3>
        {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions yet.</p>}
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <div className="text-sm font-medium">{tx.type.replace(/_/g, " ")}</div>
                <div className="text-xs text-gray-400">
                  {new Date(tx.createdAt).toLocaleString()}
                  {tx.reference ? ` · ${tx.reference}` : ""}
                </div>
              </div>
              <div className={`text-sm font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
