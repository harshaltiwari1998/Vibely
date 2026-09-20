import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api, { unwrap } from "../../lib/api";
import { useAuthStore } from "../../store/auth";

type User = {
  id: string;
  username: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = useAuthStore((s) => s.role === "SUPER_ADMIN");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", { params: { search } });
      const result = unwrap<{ items: User[] }>(data);
      setUsers(result.items ?? []);
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

  const updateRole = async (userId: string, role: string) => {
    try {
      await api.post(`/admin/users/${userId}/role`, { role });
      load();
    } catch {
      // ignore
    }
  };

  return (
    <Page title="Admin - Users">
      <div className="mb-4 flex items-center gap-2">
        <input className="input" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Search"}</button>
      </div>
      <div className="space-y-2">
        {users.length === 0 && <div className="card">No users found.</div>}
        {users.map((u) => (
          <div key={u.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">
                {u.username}
                {u.role !== "USER" && (
                  <span className="ml-2 rounded bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">{u.role}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{u.email} · {u.status} · {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-secondary text-xs" onClick={() => updateStatus(u.id, "ACTIVE")}>Unban</button>
              <button className="btn-secondary text-xs" onClick={() => updateStatus(u.id, "RESTRICTED")}>Restrict</button>
              <button className="btn-secondary text-xs" onClick={() => updateStatus(u.id, "SUSPENDED")}>Suspend</button>
              <button className="btn-primary text-xs" onClick={() => updateStatus(u.id, "BANNED")}>Ban</button>
              {isSuperAdmin && (
                u.role === "USER" ? (
                  <button className="btn-secondary text-xs" onClick={() => updateRole(u.id, "ADMIN")}>Make Admin</button>
                ) : u.role !== "SUPER_ADMIN" ? (
                  <button className="btn-secondary text-xs" onClick={() => updateRole(u.id, "USER")}>Revoke Admin</button>
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
