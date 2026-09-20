import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";

type MatchState = "idle" | "searching" | "expired";

export function MatchPage() {
  const [status, setStatus] = useState<MatchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const onSearching = () => {
      setStatus("searching");
      setError(null);
    };
    const onCancelled = (payload: { reason?: string }) => {
      setStatus("expired");
      setError(payload.reason || "Match request ended");
    };
    const onExpired = (payload: { reason?: string }) => {
      setStatus("expired");
      setError(payload.reason || "No one accepted in time");
    };
    const onCallStarted = (payload: { callId: string; initiatorId: string; receiverId: string }) => {
      const isInitiator = payload.initiatorId === userId;
      const peerId = isInitiator ? payload.receiverId : payload.initiatorId;
      navigate("/call", { state: { callId: payload.callId, peerId, isInitiator } });
    };

    socket.on(RealtimeEvent.MatchSearching, onSearching);
    socket.on(RealtimeEvent.MatchCancelled, onCancelled);
    socket.on(RealtimeEvent.MatchExpired, onExpired);
    socket.on(RealtimeEvent.CallStarted, onCallStarted);

    return () => {
      socket.off(RealtimeEvent.MatchSearching, onSearching);
      socket.off(RealtimeEvent.MatchCancelled, onCancelled);
      socket.off(RealtimeEvent.MatchExpired, onExpired);
      socket.off(RealtimeEvent.CallStarted, onCallStarted);
    };
  }, [accessToken, userId, navigate]);

  const startMatching = async () => {
    setError(null);
    try {
      await api.post("/matching/start", {});
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage || "Failed to start matching");
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
            <p className="text-sm text-white/80">Ringing online users nearby...</p>
            <button className="rounded-full bg-white/20 px-6 py-2 font-semibold" onClick={cancelMatching}>Cancel</button>
          </div>
        )}
        {status === "expired" && (
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
