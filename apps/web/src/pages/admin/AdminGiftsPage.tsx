import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Gift = { id: string; name: string; iconUrl?: string; coinAmount: number };

export function AdminGiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/gifts");
      setGifts(data);
    } catch {
      setGifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Page title="Admin - Gifts">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gifts</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {gifts.length === 0 && <div className="card">No gifts found.</div>}
        {gifts.map((g) => (
          <div key={g.id} className="card">
            <div className="text-lg font-semibold">{g.name}</div>
            <div className="text-xs text-gray-500">{g.coinAmount} coins</div>
          </div>
        ))}
      </div>
    </Page>
  );
}
