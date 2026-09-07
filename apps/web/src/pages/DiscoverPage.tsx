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

const previewRooms = [
  { id: "preview-1", username: "Maya's Multi Show", country: "India", language: "English", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80", onlineStatus: "ONLINE", interests: [] },
  { id: "preview-2", username: "Anaya's room", country: "India", language: "Hindi", avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80", onlineStatus: "ONLINE", interests: [] },
  { id: "preview-3", username: "Weekend party", country: "India", language: "English", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80", onlineStatus: "ONLINE", interests: [] },
  { id: "preview-4", username: "Live and laughing", country: "India", language: "English", avatarUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80", onlineStatus: "ONLINE", interests: [] },
];

const partyRooms = [
  { title: "Ms. Joineg Agency", members: 1, tag: "welcome to my f", color: "#7A1E12" },
  { title: "OLA MAI", members: 3, tag: "Join Agency", color: "#2B1B08" },
  { title: "Room Level 6", members: 9, tag: "welcome", color: "#B8319B" },
  { title: "Room Level 8", members: 4, tag: "let's chat", color: "#2C1E63" },
];

export function DiscoverPage() {
  const [items, setItems] = useState<DiscoverUser[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [showParty, setShowParty] = useState(false);
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
    <Page title="">
      <div className="-mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <h1 className={`text-4xl font-black italic ${!showParty ? "text-[#ff5c82]" : "text-gray-300"}`} onClick={() => setShowParty(false)} role="button">Live</h1>
            <h1 className={`text-4xl font-black italic ${showParty ? "text-[#ff5c82]" : "text-gray-300"}`} onClick={() => setShowParty(true)} role="button">Party</h1>
          </div>
          <div className="flex gap-2"><button className="text-2xl" title="Search">⌕</button><button className="rounded-full bg-[#ff1470] px-3 py-2 text-sm font-bold text-white" title="Rankings">★</button></div>
        </div>
        {showParty ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div className="flex aspect-[.72] flex-col justify-end rounded-lg bg-gradient-to-b from-[#5b3a0a] to-[#1b1204] p-3">
              <button className="rounded-full bg-[#d8a94a] px-3 py-2 text-xs font-bold text-[#3b2506]">Join/Create family</button>
            </div>
            {partyRooms.map((room) => (
              <div key={room.title} className="flex aspect-[.72] flex-col justify-end rounded-lg p-3 text-white" style={{ background: `linear-gradient(to bottom, ${room.color}88, ${room.color})` }}>
                <p className="text-xs">👥 {room.members}</p>
                <p className="truncate font-black">{room.title}</p>
                <p className="truncate text-xs text-white/85">{room.tag}</p>
              </div>
            ))}
          </div>
        ) : (
        <>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {["India", "South Asian", "East Asian", "White", "Black"].map((filter, index) => <button key={filter} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-gradient-to-r from-[#d32df2] to-[#a44df4] text-white" : "bg-gray-200 text-gray-500"}`}>{filter}</button>)}
        </div>
        <div className="mt-5 rounded-lg bg-gradient-to-r from-[#fff3ce] to-[#fff9ef] p-4"><p className="font-bold">Multi-show preview</p><p className="mt-1 text-sm text-gray-500">See the rooms that are getting lively now.</p></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(items.length ? items : previewRooms).map((u) => (
          <article key={u.id} className="group relative aspect-[.72] overflow-hidden rounded-lg bg-gray-200 shadow-sm">
            {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-5xl font-bold text-gray-400">{u.username[0]}</div>}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-16 text-white">
              <div className="mb-2 flex justify-between text-xs"><span className="rounded-full bg-black/35 px-2 py-1">● {u.onlineStatus === "ONLINE" ? "186K" : "Offline"}</span><button type="button" onClick={() => toggleFav(u.id)} className="rounded-full bg-white/25 px-2 py-1">{favs.has(u.id) ? "♥" : "+"}</button></div>
              <p className="truncate font-bold">{u.username}</p>
              <p className="mt-1 text-xs text-white/80">{u.country} · {u.language}</p>
            </div>
          </article>
        ))}
        </div>
        </>
        )}
      </div>
    </Page>
  );
}
