import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api, { unwrap } from "../lib/api";
import { useAuthStore } from "../store/auth";

type SearchUser = { id: string; username: string; country: string; language: string; avatarUrl?: string };

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchUser[]>([]);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return;
    api.get("/profiles/discover?limit=24").then(({ data }) => {
      setItems(unwrap<SearchUser[]>(data));
    }).catch(() => setItems([]));
  }, [token]);

  const filtered = items.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()));

  return (
    <Page title="">
      <h1 className="text-3xl font-black text-[#ff5b82]">Search</h1>
      <input
        className="input mt-3"
        placeholder="Search by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-4 divide-y divide-gray-100">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fecdd3] text-lg font-bold text-[#be123c]">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : u.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{u.username}</p>
              <p className="text-xs text-gray-500">{u.country} · {u.language}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-6 text-sm text-gray-400">No matches found.</p>}
      </div>
    </Page>
  );
}
