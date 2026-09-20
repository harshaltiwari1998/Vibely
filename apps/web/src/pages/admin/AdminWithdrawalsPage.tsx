import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api, { unwrap } from "../../lib/api";

type Withdrawal = {
  id: string;
  beansAmount: number;
  payoutInr: number;
  upiId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  requestedAt: string;
  reviewNote: string | null;
  user: { username: string; email: string };
};

const statusColor: Record<Withdrawal["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/withdrawals", { params: filter ? { status: filter } : {} });
      setWithdrawals(unwrap<{ items: Withdrawal[] }>(data).items ?? []);
    } catch {
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: string, action: "APPROVE" | "REJECT" | "MARK_PAID") => {
    setBusyId(id);
    try {
      await api.post(`/withdrawals/${id}/review`, { action });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page title="Admin - Withdrawals">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Withdrawal requests</h2>
        <div className="flex items-center gap-2">
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </select>
          <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
        </div>
      </div>
      <div className="space-y-2">
        {withdrawals.length === 0 && <div className="card">No withdrawal requests found.</div>}
        {withdrawals.map((w) => (
          <div key={w.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">@{w.user.username} <span className="text-xs text-gray-400">{w.user.email}</span></div>
              <div className="text-xs text-gray-500">
                🫘 {w.beansAmount} → ₹{w.payoutInr} · UPI: {w.upiId} · {new Date(w.requestedAt).toLocaleString()}
              </div>
              {w.reviewNote && <div className="text-xs text-gray-400">Note: {w.reviewNote}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[w.status]}`}>{w.status}</span>
              {w.status === "PENDING" && (
                <>
                  <button className="btn-secondary" disabled={busyId === w.id} onClick={() => review(w.id, "APPROVE")}>Approve</button>
                  <button className="btn-secondary" disabled={busyId === w.id} onClick={() => review(w.id, "REJECT")}>Reject</button>
                </>
              )}
              {w.status === "APPROVED" && (
                <button className="btn-secondary" disabled={busyId === w.id} onClick={() => review(w.id, "MARK_PAID")}>Mark paid</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
