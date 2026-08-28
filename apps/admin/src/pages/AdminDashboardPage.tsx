import { useEffect, useState } from "react";
import { Page } from "../components/Layout";
import { api } from "../lib/api";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<{ users?: number; reports?: number; calls?: number }>({});
  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => undefined);
  }, []);
  return (
    <Page title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat"><p className="text-sm text-slate-500">Users</p><p className="text-3xl font-bold">{stats.users ?? "—"}</p></div>
        <div className="stat"><p className="text-sm text-slate-500">Reports</p><p className="text-3xl font-bold">{stats.reports ?? "—"}</p></div>
        <div className="stat"><p className="text-sm text-slate-500">Calls</p><p className="text-3xl font-bold">{stats.calls ?? "—"}</p></div>
      </div>
      <div className="card text-sm text-slate-500">Management surfaces are wired to /api/admin/* (Part 2).</div>
    </Page>
  );
}
