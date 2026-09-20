import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/auth";
import { useIncomingMatchStore } from "../store/incomingMatch";
import api from "../lib/api";
import { RealtimeEvent } from "@vibely/types";

/**
 * Mounted once near the app root (outside the per-route Layout) so an
 * incoming "random match" request can pop up no matter which page the
 * user is currently on.
 */
export function IncomingMatchModal() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const request = useIncomingMatchStore((s) => s.request);
  const setRequest = useIncomingMatchStore((s) => s.setRequest);
  const clearIfMatches = useIncomingMatchStore((s) => s.clearIfMatches);
  const clear = useIncomingMatchStore((s) => s.clear);
  const [responding, setResponding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const onIncoming = (payload: Parameters<typeof setRequest>[0]) => setRequest(payload);
    const onClosed = (payload: { matchId: string }) => clearIfMatches(payload.matchId);

    socket.on(RealtimeEvent.MatchRequestIncoming, onIncoming);
    socket.on(RealtimeEvent.MatchRequestClosed, onClosed);

    return () => {
      socket.off(RealtimeEvent.MatchRequestIncoming, onIncoming);
      socket.off(RealtimeEvent.MatchRequestClosed, onClosed);
    };
  }, [accessToken, setRequest, clearIfMatches]);

  if (!request) return null;

  const accept = async () => {
    setResponding(true);
    try {
      const { data } = await api.post("/matching/accept", { matchId: request.matchId });
      const result = data?.data ?? data;
      clear();
      navigate("/call", { state: { callId: result.callId, peerId: result.otherUserId, isInitiator: true } });
    } catch {
      clear();
    } finally {
      setResponding(false);
    }
  };

  const decline = () => clear();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
            {request.requesterAvatarUrl ? (
              <img src={request.requesterAvatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              request.requesterUsername[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold">{request.requesterUsername}</p>
            <p className="text-sm text-gray-500">wants a random video call</p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={decline} disabled={responding}>
            Decline
          </button>
          <button className="btn-primary flex-1" onClick={accept} disabled={responding}>
            {responding ? "Connecting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
