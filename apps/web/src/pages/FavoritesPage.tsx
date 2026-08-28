import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { unwrap } from "../lib/api";

type FavoriteItem = {
  id: string;
  targetUserId: string;
  targetUser: { username: string; country: string; language: string; avatarUrl?: string };
};

export function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get("/favorites");
      setItems(unwrap<FavoriteItem[]>(data));
    } catch {
      setItems([]);
    }
  };

  useEffect(() => { load(); }, []);

  const unfavorite = async (id: string, userId: string) => {
    await api.delete(`/favorites/${userId}`);
    setItems((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Page title="Favorites">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <div key={f.id} className="card flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                {f.targetUser.avatarUrl ? <img src={f.targetUser.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : f.targetUser.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{f.targetUser.username}</p>
                <p className="text-xs text-gray-500">{f.targetUser.country} • {f.targetUser.language}</p>
              </div>
            </div>
            <button className="btn-secondary w-full" onClick={() => unfavorite(f.id, f.targetUserId)}>Unfavorite</button>
          </div>
        ))}
        {items.length === 0 && <div className="card">No favorites yet.</div>}
      </div>
    </Page>
  );
}
