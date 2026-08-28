import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Analytics = {
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

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/dashboard");
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Page title="Admin - Analytics">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      {analytics ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="card"><div className="text-sm text-gray-500">Total Users</div><div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Active Users</div><div className="text-2xl font-bold text-green-600">{analytics.activeUsers.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Online Users</div><div className="text-2xl font-bold text-blue-600">{analytics.onlineUsers.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Calls</div><div className="text-2xl font-bold">{analytics.calls.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Messages</div><div className="text-2xl font-bold">{analytics.messages.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Coins Purchased</div><div className="text-2xl font-bold text-yellow-600">{analytics.coinsPurchased.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Gifts Sent</div><div className="text-2xl font-bold text-pink-600">{analytics.giftsSent.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Reports</div><div className="text-2xl font-bold text-red-600">{analytics.reports.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Banned Users</div><div className="text-2xl font-bold text-red-800">{analytics.bannedUsers.toLocaleString()}</div></div>
          <div className="card"><div className="text-sm text-gray-500">Restricted Users</div><div className="text-2xl font-bold text-orange-600">{analytics.restrictedUsers.toLocaleString()}</div></div>
        </div>
      ) : (
        <div className="card">Failed to load analytics.</div>
      )}
    </Page>
  );
}
