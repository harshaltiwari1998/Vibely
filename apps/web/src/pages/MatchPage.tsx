import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api, { unwrap } from "../lib/api";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";

type MatchState = "idle" | "searching" | "matched" | "cancelled" | "expired";

export function MatchPage() {
  const [status, setStatus] = useState<MatchState>("idle");
  const [peer, setPeer] = useState<{ username: string; avatarUrl?: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

  useEffect(() => {
    if (!accessToken) return;
    const socket: Socket = io(wsUrl, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setError(null);
    });

    socket.on(RealtimeEvent.MatchSearching, () => {
      setStatus("searching");
      setError(null);
    });

    socket.on(RealtimeEvent.MatchFound, (payload: { matchId: string; peerId: string }) => {
      setStatus("matched");
      setMatchId(payload.matchId);
      fetchPeer(payload.peerId);
    });

    socket.on(RealtimeEvent.MatchCancelled, (payload: { matchId: string; reason?: string }) => {
      setStatus("cancelled");
      setMatchId(payload.matchId);
      setError(payload.reason || "Match cancelled");
    });

    socket.on(RealtimeEvent.MatchExpired, (payload: { matchId: string; reason?: string }) => {
      setStatus("expired");
      setMatchId(payload.matchId);
      setError(payload.reason || "Match expired");
    });

    socket.on("disconnect", () => {
      setStatus("idle");
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, wsUrl]);

  const fetchPeer = async (peerId: string) => {
    try {
      const { data } = await api.get(`/users/${peerId}`);
      const user = unwrap<{ username: string; avatarUrl?: string }>(data);
      setPeer(user);
    } catch {
      setPeer(null);
    }
  };

  const startMatching = async () => {
    setError(null);
    try {
      await api.post("/matching/start", {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start matching");
      setStatus("idle");
    }
  };

  const cancelMatching = async () => {
    try {
      await api.post("/matching/cancel", {});
    } catch {
      // ignore
    }
    setStatus("idle");
    setMatchId(null);
    setPeer(null);
  };

  const acceptMatch = async () => {
    if (!matchId) return;
    try {
      await api.post("/matching/accept", { matchId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    }
  };

  const declineMatch = async () => {
    if (!matchId) return;
    try {
      await api.post("/matching/decline", { matchId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to decline");
    }
    setStatus("idle");
    setMatchId(null);
    setPeer(null);
  };

  const skipMatch = async () => {
    if (!matchId) return;
    try {
      await api.post("/matching/skip", { matchId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to skip");
    }
    setStatus("idle");
    setMatchId(null);
    setPeer(null);
  };

  return (
    <Page title="Find a match" description="Get paired with a random person for a 1-to-1 call.">
      <div className="card flex flex-col items-center gap-4">
        <div className="text-5xl">
          {status === "searching" ? "🔄" : status === "matched" ? "🎉" : status === "cancelled" || status === "expired" ? "❌" : "✨"}
        </div>
        {status === "idle" && (
          <button className="btn-primary" onClick={startMatching}>Start matching</button>
        )}
        {status === "searching" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">Searching for someone nearby...</p>
            <button className="btn-secondary" onClick={cancelMatching}>Cancel</button>
          </div>
        )}
        {status === "matched" && peer && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                {peer.avatarUrl ? <img src={peer.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : peer.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{peer.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={acceptMatch}>Accept</button>
              <button className="btn-secondary" onClick={skipMatch}>Skip</button>
              <button className="btn-secondary" onClick={declineMatch}>Decline</button>
            </div>
          </div>
        )}
        {(status === "cancelled" || status === "expired") && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-red-600">{error || "Match ended"}</p>
            <button className="btn-primary" onClick={() => setStatus("idle")}>Try again</button>
          </div>
        )}
        {error && status === "idle" && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Page>
  );
}
