import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { unwrap } from "../lib/api";
import { useAuthStore } from "../store/auth";

type DiscoverUser = {
  id: string;
  username: string;
  country: string;
  language: string;
  avatarUrl?: string;
  bio?: string;
  interests: string[];
  onlineStatus: string;
};

export function DiscoverPage() {
  const [items, setItems] = useState<DiscoverUser[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const token = useAuthStore((s) => s.accessToken);

  const load = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/profiles/discover?limit=24");
      const profiles = unwrap<DiscoverUser[]>(data);
      setItems(profiles);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => { load(); }, [token]);

  const toggleFav = async (userId: string) => {
    if (!token) return;
    try {
      if (favs.has(userId)) {
        await api.delete(`/favorites/${userId}`);
        setFavs((prev) => { const n = new Set(prev); n.delete(userId); return n; });
      } else {
        await api.post(`/favorites/${userId}`);
        setFavs((prev) => new Set(prev).add(userId));
      }
    } catch {
      // ignore
    }
  };

  return (
    <Page title="Discover" description="Browse people you can connect with.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((u) => (
          <div key={u.id} className="card flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : u.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{u.username}</p>
                <p className="text-xs text-gray-500">{u.country} • {u.language}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{u.bio || "No bio"}</p>
            <div className="flex flex-wrap gap-1">
              {(u.interests ?? []).map((i) => (
                <span key={i} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">{i}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1 text-xs ${u.onlineStatus === "ONLINE" ? "text-green-600" : "text-gray-400"}`}>
                <span className={`h-2 w-2 rounded-full ${u.onlineStatus === "ONLINE" ? "bg-green-500" : "bg-gray-300"}`} />
                {u.onlineStatus}
              </span>
              <button className="btn-secondary" onClick={() => toggleFav(u.id)}>
                {favs.has(u.id) ? "Unfavorite" : "Favorite"}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="card">No profiles loaded yet.</div>}
      </div>
    </Page>
  );
}
