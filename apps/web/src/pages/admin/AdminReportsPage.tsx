import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Report = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { username: string };
  targetUser: { username: string; status: string };
};

export function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reports");
      setReports(data.items ?? []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Page title="Admin - Reports">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reports</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="space-y-2">
        {reports.length === 0 && <div className="card">No reports found.</div>}
        {reports.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.reporter.username} → {r.targetUser.username}</div>
                <div className="text-xs text-gray-500">{r.reason} · {r.status} · {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <span className={`rounded px-2 py-1 text-xs ${
                r.status === "OPEN" ? "bg-red-100 text-red-800" :
                r.status === "UNDER_REVIEW" ? "bg-yellow-100 text-yellow-800" :
                r.status === "RESOLVED" ? "bg-green-100 text-green-800" :
                "bg-gray-100 text-gray-800"
              }`}>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
