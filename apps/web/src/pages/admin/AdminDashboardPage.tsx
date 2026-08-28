import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Stats = {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  calls: number;
  messages: number;
  coinsPurchased: number;
  giftsSent: number;
  reports: number;
  bannedUsers: number;
  restrictedUsers: number;
};

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/dashboard");
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const StatCard = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <div className="card">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color || ""}`}>{value.toLocaleString()}</div>
    </div>
  );

  return (
    <Page title="Admin Dashboard">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Overview</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Active Users" value={stats.activeUsers} color="text-green-600" />
          <StatCard label="Online Users" value={stats.onlineUsers} color="text-blue-600" />
          <StatCard label="Calls" value={stats.calls} />
          <StatCard label="Messages" value={stats.messages} />
          <StatCard label="Coins Purchased" value={stats.coinsPurchased} color="text-yellow-600" />
          <StatCard label="Gifts Sent" value={stats.giftsSent} color="text-pink-600" />
          <StatCard label="Reports" value={stats.reports} color="text-red-600" />
          <StatCard label="Banned Users" value={stats.bannedUsers} color="text-red-800" />
          <StatCard label="Restricted Users" value={stats.restrictedUsers} color="text-orange-600" />
        </div>
      ) : (
        <div className="card">Failed to load stats.</div>
      )}
    </Page>
  );
}
