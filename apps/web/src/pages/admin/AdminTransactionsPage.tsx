import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Transaction = { id: string; type: string; amount: number; createdAt: string; user: { username: string } };

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/transactions");
      setTransactions(data.items ?? []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Page title="Admin - Transactions">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transactions</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="space-y-2">
        {transactions.length === 0 && <div className="card">No transactions found.</div>}
        {transactions.map((t) => (
          <div key={t.id} className="card">
            <div className="font-medium">{t.user.username}</div>
            <div className="text-xs text-gray-500">{t.type} · {t.amount} coins · {new Date(t.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}
