import { useEffect, useRef, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";

type Gift = {
  id: string;
  name: string;
  iconUrl: string;
  coinCost: number;
  active: boolean;
};

type GiftHistory = {
  sent: { id: string; gift: Gift; to: { username: string }; coinAmount: number; createdAt: string }[];
  received: { id: string; gift: Gift; from: { username: string }; coinAmount: number; createdAt: string }[];
};

export function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [history, setHistory] = useState<GiftHistory>({ sent: [], received: [] });
  const [balance, setBalance] = useState<number>(0);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [recipientId, setRecipientId] = useState("");
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

  const loadGifts = async () => {
    try {
      const { data } = await api.get("/gifts");
      setGifts(data ?? []);
    } catch {
      setGifts([]);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/gifts/history");
      setHistory(data ?? { sent: [], received: [] });
    } catch {
      setHistory({ sent: [], received: [] });
    }
  };

  const loadBalance = async () => {
    try {
      const { data } = await api.get("/wallet");
      setBalance(data.balance ?? 0);
    } catch {
      setBalance(0);
    }
  };

  useEffect(() => {
    loadGifts();
    loadHistory();
    loadBalance();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const sock = io(wsUrl, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket"],
    });
    socketRef.current = sock;

    sock.on(RealtimeEvent.GiftReceived, (payload: { giftId: string; senderId: string; coinAmount: number; giftName?: string; iconUrl?: string; senderName?: string }) => {
      loadHistory();
      loadBalance();
      alert(`You received ${payload.giftName ?? "a gift"} from ${payload.senderName ?? "someone"}!`);
    });

    sock.on(RealtimeEvent.GiftSent, () => {
      loadHistory();
      loadBalance();
    });

    return () => {
      sock.disconnect();
    };
  }, [accessToken, wsUrl]);

  const sendGift = async () => {
    if (!selectedGift || !recipientId.trim() || !socketRef.current) return;
    setSending(true);
    try {
      socketRef.current.emit("gift_sent", {
        receiverId: recipientId.trim(),
        giftId: selectedGift.id,
      });
      setSelectedGift(null);
      setRecipientId("");
    } catch {
      alert("Failed to send gift");
    } finally {
      setSending(false);
    }
  };

  return (
    <Page title="Gifts">
      <div className="card space-y-4">
        <div>
          <p className="text-sm text-gray-500">Your balance</p>
          <p className="text-3xl font-bold">{balance} coins</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Gift Catalog</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {gifts.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGift(g)}
                className={`card text-left ${selectedGift?.id === g.id ? "ring-2 ring-brand-500" : ""}`}
              >
                <div className="text-2xl">{g.iconUrl}</div>
                <div className="font-medium">{g.name}</div>
                <div className="text-sm text-gray-500">{g.coinCost} coins</div>
              </button>
            ))}
          </div>
        </div>

        {selectedGift && (
          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="mb-2 font-semibold">Send {selectedGift.name}</h4>
            <input
              className="input mb-2"
              placeholder="Recipient user ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={sendGift} disabled={sending || balance < selectedGift.coinCost}>
                {sending ? "Sending..." : `Send (${selectedGift.coinCost} coins)`}
              </button>
              <button className="btn-secondary" onClick={() => setSelectedGift(null)}>Cancel</button>
            </div>
            {balance < selectedGift.coinCost && (
              <p className="mt-2 text-sm text-red-500">Insufficient balance</p>
            )}
          </div>
        )}
      </div>

      <div className="card mt-4">
        <h3 className="mb-3 text-lg font-semibold">Gift History</h3>
        {history.sent.length === 0 && history.received.length === 0 && (
          <p className="text-sm text-gray-400">No gifts yet.</p>
        )}
        <div className="space-y-2">
          {history.sent.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <div className="text-sm font-medium">Sent {g.gift.iconUrl} {g.gift.name} to {g.to.username}</div>
                <div className="text-xs text-gray-400">{new Date(g.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm font-semibold text-red-600">-{g.coinAmount}</div>
            </div>
          ))}
          {history.received.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <div className="text-sm font-medium">Received {g.gift.iconUrl} {g.gift.name} from {g.from.username}</div>
                <div className="text-xs text-gray-400">{new Date(g.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm font-semibold text-green-600">+{g.coinAmount}</div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
