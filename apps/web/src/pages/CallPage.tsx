import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Page } from "../components/Page";
import { VideoCallService, CALL_SIGNALING_EVENTS } from "../services/videoCall";
import { Socket } from "socket.io-client";
import { getSocket, getSignalSocket } from "../lib/socket";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";
import { useLocalization } from "../locales";

type CallState = "idle" | "connecting" | "connected" | "reconnecting" | "failed" | "ended";

type NetworkQuality = "excellent" | "good" | "poor" | "offline";

export function CallPage() {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  // Refs (not state) because socket event handlers are registered once inside
  // the effect below and would otherwise close over stale state values.
  const callRef = useRef<VideoCallService | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const [call, setCall] = useState<VideoCallService | null>(null);
  const signalSocketRef = useRef<Socket | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkQuality, _setNetworkQuality] = useState<NetworkQuality>("good");
  const [remoteStatus, setRemoteStatus] = useState<string>("connecting");
  const containerRef = useRef<HTMLDivElement>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useLocalization();
  const location = useLocation();
  const navState = location.state as { callId?: string; peerId?: string; isInitiator?: boolean } | null;

  useEffect(() => {
    if (!accessToken) return;
    const sock = getSocket(accessToken);
    // WebRTC signaling (offer/answer/ICE/ready/end/failed) is handled by a
    // separate gateway on the `/signal` namespace, not the default one.
    const signalSock = getSignalSocket(accessToken);
    signalSocketRef.current = signalSock;

    const onCallStarted = (payload: { callId: string; initiatorId: string; receiverId: string }) => {
      const myId = useAuthStore.getState().userId;
      const isInitiator = myId === payload.initiatorId;
      const resolvedPeerId = isInitiator ? payload.receiverId : payload.initiatorId;
      setCallId(payload.callId);
      peerIdRef.current = resolvedPeerId;
      startCall(signalSock, payload.callId, isInitiator);
    };

    const onCallOffer = async (payload: { callId: string; fromUserId: string; sdp: unknown }) => {
      if (!callRef.current) return;
      const answer = await callRef.current.createAnswer(payload.sdp as never);
      signalSock.emit(CALL_SIGNALING_EVENTS.answer, {
        callId: payload.callId,
        toUserId: payload.fromUserId,
        sdp: answer,
      });
    };

    const onCallAnswer = async (payload: { callId: string; fromUserId: string; sdp: unknown }) => {
      if (!callRef.current) return;
      await callRef.current.setRemoteDescription(payload.sdp as never);
      setCallState("connecting");
    };

    const onIceCandidate = async (payload: { callId: string; fromUserId: string; candidate: unknown }) => {
      if (!callRef.current) return;
      await callRef.current.addIceCandidate(payload.candidate as never);
    };

    const onCallReady = () => {
      setCallState("connecting");
      setRemoteStatus("connected");
    };

    const onCallEnded = () => {
      endCall(false);
      setRemoteStatus("ended");
    };

    const onCallFailed = () => {
      setCallState("failed");
      setRemoteStatus("failed");
      endCall(false);
    };

    const onCallReconnect = () => {
      setCallState("reconnecting");
      setRemoteStatus("reconnecting");
    };

    sock.on(RealtimeEvent.CallStarted, onCallStarted);
    sock.on(RealtimeEvent.CallEnded, onCallEnded);
    sock.on(RealtimeEvent.CallFailed, onCallFailed);
    sock.on(RealtimeEvent.CallReconnect, onCallReconnect);
    signalSock.on(RealtimeEvent.CallOffer, onCallOffer);
    signalSock.on(RealtimeEvent.CallAnswer, onCallAnswer);
    signalSock.on(RealtimeEvent.IceCandidate, onIceCandidate);
    signalSock.on(RealtimeEvent.CallReady, onCallReady);

    // A call may already have been arranged (e.g. from the match-accept
    // flow) before this effect ran, so a CallStarted broadcast for it could
    // already have fired. Start directly from the navigation state instead
    // of waiting for another one.
    if (navState?.callId && navState.peerId) {
      setCallId(navState.callId);
      peerIdRef.current = navState.peerId;
      startCall(signalSock, navState.callId, Boolean(navState.isInitiator));
    }

    return () => {
      sock.off(RealtimeEvent.CallStarted, onCallStarted);
      sock.off(RealtimeEvent.CallEnded, onCallEnded);
      sock.off(RealtimeEvent.CallFailed, onCallFailed);
      sock.off(RealtimeEvent.CallReconnect, onCallReconnect);
      signalSock.off(RealtimeEvent.CallOffer, onCallOffer);
      signalSock.off(RealtimeEvent.CallAnswer, onCallAnswer);
      signalSock.off(RealtimeEvent.IceCandidate, onIceCandidate);
      signalSock.off(RealtimeEvent.CallReady, onCallReady);
      endCall(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const startCall = async (sock: Socket, cid: string, isInitiator: boolean) => {
    const service = new VideoCallService({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:turn.vibely.app:3478", username: "vibely", credential: "vibely" },
      ],
    });
    service.onRemoteStream = (remoteStream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
        // Assigning srcObject imperatively doesn't reliably trigger the
        // `autoplay` attribute in every browser; play() explicitly.
        remoteVideo.current.play().catch(() => {});
      }
      setCallState("connected");
    };
    service.onConnectionStateChange = (state) => {
      if (state === "failed") {
        setCallState("failed");
      } else if (state === "connecting") {
        setCallState("connecting");
      } else if (state === "connected") {
        setCallState("connected");
      } else if (state === "disconnected") {
        setCallState("reconnecting");
      }
    };
    service.onIceCandidate = (candidate) => {
      sock.emit(CALL_SIGNALING_EVENTS.ice, {
        callId: cid,
        toUserId: peerIdRef.current,
        candidate,
      });
    };

    try {
      const stream = await service.initialize();
      if (localVideo.current) localVideo.current.srcObject = stream;
      callRef.current = service;
      setCall(service);

      if (isInitiator) {
        const offer = await service.createOffer();
        sock.emit(CALL_SIGNALING_EVENTS.offer, {
          callId: cid,
          toUserId: peerIdRef.current,
          sdp: offer,
        });
      } else {
        sock.emit(RealtimeEvent.CallReady, { callId: cid });
      }

      startTimer();
    } catch (err) {
      console.error("Failed to start call", err);
      setCallState("failed");
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  };

  // `notifyServer` must stay false for the effect-cleanup path: React 18
  // StrictMode (dev only) mounts every component twice, running an effect's
  // cleanup immediately after its setup. If that cleanup told the server
  // the call had ended, every real call would be killed within
  // milliseconds of starting. Only an explicit user action (the End Call
  // button) should actually end the call for the other side.
  const endCall = (notifyServer: boolean) => {
    callRef.current?.endCall();
    callRef.current = null;
    setCall(null);
    setCallState("ended");
    setElapsed(0);
    if (notifyServer && signalSocketRef.current && callId) {
      signalSocketRef.current.emit("call_end", { callId });
    }
  };

  const toggleAudio = () => {
    if (!call) return;
    const next = !muted;
    call.muteAudio(next);
    setMuted(next);
  };

  const toggleVideo = () => {
    if (!call) return;
    const next = !camOff;
    call.muteVideo(next);
    setCamOff(next);
  };

  const switchCamera = async () => {
    await call?.switchCamera();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Page title={t.call.title}>
      <div ref={containerRef} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-video rounded-xl bg-black">
            <video ref={localVideo} autoPlay playsInline muted className="h-full w-full rounded-xl object-cover" />
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">You</span>
            {muted && <span className="absolute top-2 right-2 rounded bg-red-500/80 px-2 py-0.5 text-xs text-white">Mic off</span>}
            {camOff && <span className="absolute top-2 left-2 rounded bg-red-500/80 px-2 py-0.5 text-xs text-white">Cam off</span>}
          </div>
          <div className="relative aspect-video rounded-xl bg-black">
            <video ref={remoteVideo} autoPlay playsInline className="h-full w-full rounded-xl object-cover" />
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">Peer</span>
            {remoteStatus === "connecting" && <span className="absolute top-2 right-2 rounded bg-yellow-500/80 px-2 py-0.5 text-xs text-white">Connecting...</span>}
            {remoteStatus === "reconnecting" && <span className="absolute top-2 right-2 rounded bg-yellow-500/80 px-2 py-0.5 text-xs text-white">Reconnecting...</span>}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${
              networkQuality === "excellent" ? "bg-green-500" :
              networkQuality === "good" ? "bg-green-400" :
              networkQuality === "poor" ? "bg-yellow-500" : "bg-red-500"
            }`} />
            <span className="text-xs text-gray-600 capitalize">{networkQuality}</span>
          </div>
          <div className="text-center text-lg font-mono">
            {callState === "connecting" && <span className="text-yellow-600">{t.call.connecting}</span>}
            {callState === "connected" && <span className="text-green-600">{formatTime(elapsed)}</span>}
            {callState === "reconnecting" && <span className="text-yellow-600 animate-pulse">{t.call.reconnecting}</span>}
            {callState === "failed" && <span className="text-red-600">{t.call.failed}</span>}
            {callState === "ended" && <span className="text-gray-600">{t.call.ended}</span>}
          </div>
          <div className="text-xs text-gray-500">
            {callState === "connected" && `Remote: ${remoteStatus}`}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-secondary" onClick={toggleAudio}>{muted ? t.call.unmute : t.call.mute}</button>
          <button className="btn-secondary" onClick={toggleVideo}>{camOff ? t.call.cameraOn : t.call.cameraOff}</button>
          <button className="btn-secondary" onClick={switchCamera}>{t.call.switchCamera}</button>
          <button className="btn-secondary" onClick={toggleFullscreen}>{isFullscreen ? t.call.exitFullscreen : t.call.fullscreen}</button>
          <button className="btn-primary" onClick={() => endCall(true)}>{t.call.endCall}</button>
        </div>
      </div>
    </Page>
  );
}
