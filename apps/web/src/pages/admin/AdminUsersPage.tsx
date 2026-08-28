import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type User = {
  id: string;
  username: string;
  email: string;
  status: string;
  createdAt: string;
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", { params: { search } });
      setUsers(data.items ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (userId: string, status: string) => {
    try {
      await api.post(`/admin/users/${userId}/status`, { status });
      load();
    } catch {
      // ignore
    }
  };

  return (
    <Page title="Admin - Users">
      <div className="mb-4 flex items-center gap-2">
        <input className="input" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Search"}</button>
      </div>
      <div className="space-y-2">
        {users.length === 0 && <div className="card">No users found.</div>}
        {users.map((u) => (
          <div key={u.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{u.username}</div>
              <div className="text-xs text-gray-500">{u.email} · {u.status} · {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => updateStatus(u.id, "ACTIVE")}>Unban</button>
              <button className="btn-secondary text-xs" onClick={() => updateStatus(u.id, "RESTRICTED")}>Restrict</button>
              <button className="btn-secondary text-xs" onClick={() => updateStatus(u.id, "SUSPENDED")}>Suspend</button>
              <button className="btn-primary text-xs" onClick={() => updateStatus(u.id, "BANNED")}>Ban</button>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
