import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type ModerationAction = { id: string; action: string; reason: string; createdAt: string; moderator: { username: string }; targetUser: { username: string; status: string } };

export function AdminModerationPage() {
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/moderation/actions");
      setActions(data.items ?? []);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Page title="Admin - Moderation">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Moderation Actions</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="space-y-2">
        {actions.length === 0 && <div className="card">No moderation actions found.</div>}
        {actions.map((a) => (
          <div key={a.id} className="card">
            <div className="font-medium">{a.action} - {a.targetUser.username}</div>
            <div className="text-xs text-gray-500">{a.reason} · by {a.moderator.username} · {new Date(a.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}
