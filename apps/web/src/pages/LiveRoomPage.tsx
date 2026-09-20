import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Room, RoomEvent, RemoteTrack, Track } from "livekit-client";
import { io, Socket } from "socket.io-client";
import { Page } from "../components/Page";
import api, { unwrap } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";

type JoinLiveResult = {
  room: { id: string; title: string; host: { id: string; username: string } };
  token: string;
  livekitUrl: string;
};

type ChatEntry = { userId: string; username: string; content: string };
type Gift = { id: string; name: string; iconUrl: string; coinCost: number };

export function LiveRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

  const [hostName, setHostName] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!roomId || !accessToken) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get(`/live/${roomId}/join`);
        const result = unwrap<JoinLiveResult>(data);
        if (cancelled) return;
        setHostName(result.room.host.username);

        const room = new Room();
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video && remoteVideo.current) {
            track.attach(remoteVideo.current);
          }
        });
        await room.connect(result.livekitUrl, result.token);

        const socket = io(`${wsUrl}/live`, {
          auth: { token: `Bearer ${accessToken}` },
          transports: ["websocket"],
        });
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("live_join", { roomId }));

        socket.on(RealtimeEvent.LiveViewerJoined, (p: { viewerCount: number }) => setViewerCount(p.viewerCount));
        socket.on(RealtimeEvent.LiveViewerLeft, (p: { viewerCount: number }) => setViewerCount(p.viewerCount));
        socket.on(RealtimeEvent.LiveChatMessage, (p: ChatEntry) =>
          setMessages((prev) => [...prev.slice(-49), p]),
        );
        socket.on(RealtimeEvent.LiveGiftSent, (p: { senderName: string; giftName: string; iconUrl: string }) =>
          setMessages((prev) => [
            ...prev.slice(-49),
            { userId: "", username: "🎁", content: `${p.senderName} sent ${p.iconUrl} ${p.giftName}` },
          ]),
        );
        socket.on(RealtimeEvent.LiveEnded, () => setEnded(true));
      } catch {
        setEnded(true);
      }
    })();

    api
      .get("/gifts")
      .then(({ data }) => setGifts(unwrap<Gift[]>(data) ?? []))
      .catch(() => setGifts([]));

    return () => {
      cancelled = true;
      socketRef.current?.emit("live_leave", { roomId });
      socketRef.current?.disconnect();
      void roomRef.current?.disconnect();
    };
  }, [roomId, accessToken, wsUrl]);

  const sendChat = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit(RealtimeEvent.LiveChatMessage, { roomId, content: chatInput.trim() });
    setChatInput("");
  };

  const sendGift = (giftId: string) => {
    socketRef.current?.emit(RealtimeEvent.LiveGiftSent, { roomId, giftId });
    setShowGifts(false);
  };

  if (ended) {
    return (
      <Page title="Live ended">
        <div className="card text-center">
          <p className="mb-4 text-gray-500">This live has ended.</p>
          <button className="btn-primary" onClick={() => navigate("/live")}>
            Back to Live
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`@${hostName || "..."}`}>
      <div className="card space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <video ref={remoteVideo} autoPlay playsInline className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            🔴 LIVE · 👁 {viewerCount}
          </span>
        </div>

        <div className="h-40 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-2 text-sm">
          {messages.length === 0 && <p className="text-gray-400">No messages yet.</p>}
          {messages.map((m, i) => (
            <p key={i}>
              <span className="font-semibold">{m.username}: </span>
              {m.content}
            </p>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Say something..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button className="btn-secondary" onClick={sendChat}>Send</button>
          <button className="btn-primary" onClick={() => setShowGifts((v) => !v)}>🎁</button>
        </div>

        {showGifts && (
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-gray-200 p-2 sm:grid-cols-6">
            {gifts.map((g) => (
              <button key={g.id} className="rounded-lg border border-gray-100 p-2 text-center" onClick={() => sendGift(g.id)}>
                <div className="text-xl">{g.iconUrl}</div>
                <div className="text-[10px] text-gray-500">{g.coinCost}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
