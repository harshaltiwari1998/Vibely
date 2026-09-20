import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import api, { unwrap } from "../lib/api";

type LiveRoomListItem = {
  id: string;
  title: string;
  country: string | null;
  coverUrl: string | null;
  peakViewers: number;
  startedAt: string;
  host: { id: string; username: string; avatarUrl: string | null };
};

export function LivePage() {
  const [rooms, setRooms] = useState<LiveRoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRooms = async () => {
    try {
      const { data } = await api.get("/live");
      setRooms(unwrap<LiveRoomListItem[]>(data) ?? []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Page title="Live">
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => navigate("/live/go-live")}>
          Go Live
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading live rooms...</p>}
      {!loading && rooms.length === 0 && (
        <p className="text-sm text-gray-400">No one is live right now. Be the first!</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => navigate(`/live/${room.id}`)}
            className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-purple-900 to-fuchsia-800 text-left text-white shadow"
          >
            {room.coverUrl ? (
              <img src={room.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            ) : null}
            <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold">
              🔴 LIVE
            </span>
            <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px]">
              👁 {room.peakViewers}
            </span>
            <div className="absolute inset-x-0 bottom-0 space-y-0.5 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="truncate text-sm font-bold">{room.title}</p>
              <p className="truncate text-xs text-white/80">@{room.host.username}</p>
            </div>
          </button>
        ))}
      </div>
    </Page>
  );
}
