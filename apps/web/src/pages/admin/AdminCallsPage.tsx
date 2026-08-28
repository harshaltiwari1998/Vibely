import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Call = { id: string; initiator: { username: string }; receiver: { username: string }; startedAt: string; durationSeconds: number; status: string };

export function AdminCallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/calls");
      setCalls(data.items ?? []);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Page title="Admin - Calls">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Calls</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="space-y-2">
        {calls.length === 0 && <div className="card">No calls found.</div>}
        {calls.map((c) => (
          <div key={c.id} className="card">
            <div className="font-medium">{c.initiator.username} → {c.receiver.username}</div>
            <div className="text-xs text-gray-500">{new Date(c.startedAt).toLocaleString()} · {c.durationSeconds}s · {c.status}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}
