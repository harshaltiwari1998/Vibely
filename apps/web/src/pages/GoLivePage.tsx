import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Room } from "livekit-client";
import { io, Socket } from "socket.io-client";
import { Page } from "../components/Page";
import api, { unwrap } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";

type StartLiveResult = {
  room: { id: string; title: string };
  token: string;
  livekitUrl: string;
};

export function GoLivePage() {
  const [title, setTitle] = useState("");
  const [live, setLive] = useState<StartLiveResult | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      void roomRef.current?.disconnect();
      socketRef.current?.disconnect();
    };
  }, []);

  const startLive = async () => {
    if (!title.trim()) {
      setError("Give your live a title first");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const { data } = await api.post("/live/start", { title: title.trim() });
      const result = unwrap<StartLiveResult>(data);
      setLive(result);

      const room = new Room();
      roomRef.current = room;
      await room.connect(result.livekitUrl, result.token);
      const publication = await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);
      const track = publication?.videoTrack;
      if (track && localVideo.current) {
        track.attach(localVideo.current);
      }

      const socket = io(`${wsUrl}/live`, {
        auth: { token: `Bearer ${accessToken}` },
        transports: ["websocket"],
      });
      socketRef.current = socket;
      socket.on("connect", () => socket.emit("live_join", { roomId: result.room.id }));
      socket.on(RealtimeEvent.LiveViewerJoined, (payload: { viewerCount: number }) => setViewerCount(payload.viewerCount));
      socket.on(RealtimeEvent.LiveViewerLeft, (payload: { viewerCount: number }) => setViewerCount(payload.viewerCount));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start live");
      setLive(null);
    } finally {
      setStarting(false);
    }
  };

  const endLive = async () => {
    if (!live) return;
    try {
      await api.post(`/live/${live.room.id}/end`, {});
    } catch {
      // ignore
    }
    await roomRef.current?.disconnect();
    socketRef.current?.disconnect();
    roomRef.current = null;
    socketRef.current = null;
    setLive(null);
    navigate("/live");
  };

  return (
    <Page title="Go Live">
      <div className="card space-y-4">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <video ref={localVideo} autoPlay playsInline muted className="h-full w-full object-cover" />
          {live && (
            <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              🔴 LIVE · 👁 {viewerCount}
            </span>
          )}
        </div>

        {!live ? (
          <div className="space-y-2">
            <input
              className="input"
              placeholder="What's your live about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button className="btn-primary w-full" onClick={startLive} disabled={starting}>
              {starting ? "Starting..." : "Start Live"}
            </button>
          </div>
        ) : (
          <button className="btn-secondary w-full" onClick={endLive}>
            End Live
          </button>
        )}
      </div>
    </Page>
  );
}
