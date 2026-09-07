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
    <Page title="">
      <div className="relative -mt-5 -mx-4 min-h-[calc(100vh-68px)] overflow-hidden bg-[#510023] px-5 pb-16 pt-9 text-white md:mx-0 md:min-h-[620px] md:rounded-lg">
        <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_50%_34%,#f639af_0,transparent_18%),radial-gradient(circle_at_50%_44%,#59148e_0,transparent_38%),linear-gradient(145deg,#2e001d,#870038_56%,#310018)]" />
        <div className="relative mx-auto flex max-w-lg flex-col items-center">
          <div className="flex w-full items-center justify-between">
            <span className="rounded-full bg-white/25 px-4 py-2 font-bold">💎 5,385</span>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1470] text-lg" title="Achievements">★</button>
          </div>
          <div className="relative mt-10 flex aspect-square w-full max-w-[390px] items-center justify-center rounded-full border border-cyan-300/30 bg-[radial-gradient(circle,#d248cb_0%,#3b115e_48%,transparent_49%)] shadow-[0_0_80px_rgba(236,59,211,.5)]">
            <div className="absolute inset-[13%] rounded-full border border-fuchsia-200/40" />
            <div className="absolute inset-[24%] rounded-full border border-cyan-100/30" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-fuchsia-100/70 bg-gradient-to-br from-[#fd9cf3] via-[#cb5df6] to-[#5f2bdb] text-6xl shadow-[0_0_50px_rgba(255,178,245,.8)]">♥</div>
          </div>
          <p className="mt-7 rounded-full bg-[#cf2876]/80 px-5 py-2 text-center text-sm font-semibold">861 girl waiting for a match</p>
          <div className="mt-7 flex flex-col items-center gap-3">
        {status === "idle" && (
          <button className="flex items-center gap-3 rounded-full border border-orange-200 bg-gradient-to-r from-[#ff8c13] via-[#fd1677] to-[#fb3c25] px-12 py-4 text-xl font-black shadow-lg" onClick={startMatching}>
            <span>Random match <span className="ml-2 text-base">💎 600</span></span>
            <span className="rounded bg-white/25 px-2 py-1 text-xs font-black">LIVE</span>
          </button>
        )}
        {status === "searching" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-white/80">Searching for someone nearby...</p>
            <button className="rounded-full bg-white/20 px-6 py-2 font-semibold" onClick={cancelMatching}>Cancel</button>
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
              <button className="rounded-full bg-[#ff267b] px-4 py-2 font-bold" onClick={acceptMatch}>Accept</button>
              <button className="rounded-full bg-white/20 px-4 py-2 font-bold" onClick={skipMatch}>Skip</button>
              <button className="rounded-full bg-white/20 px-4 py-2 font-bold" onClick={declineMatch}>Decline</button>
            </div>
          </div>
        )}
        {(status === "cancelled" || status === "expired") && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-red-200">{error || "Match ended"}</p>
            <button className="rounded-full bg-[#ff267b] px-6 py-2 font-bold" onClick={() => setStatus("idle")}>Try again</button>
          </div>
        )}
        {error && status === "idle" && <p className="text-sm text-red-200">{error}</p>}
          </div>
        </div>
      </div>
    </Page>
  );
}
