import { RealtimeEvent } from "@vibely/types";

export interface VideoCallOptions {
  iceServers?: RTCIceServer[];
  localStream?: MediaStream;
}

/**
 * Client-side WebRTC abstraction for 1-to-1 video/audio calls.
 *
 * This is the foundation contract required by the platform:
 *   initialize, createOffer, createAnswer, setRemoteDescription,
 *   addIceCandidate, muteAudio, muteVideo, switchCamera, endCall.
 *
 * It wraps a single RTCPeerConnection and exposes lifecycle hooks. The
 * signaling transport is supplied by the caller (e.g. via the WebSocket
 * signaling gateway) — this class only manages the peer connection.
 */
export class VideoCallService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private iceServers: RTCIceServer[];

  onRemoteStream: ((stream: MediaStream) => void) | null = null;
  onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;
  onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor(options: VideoCallOptions = {}) {
    this.iceServers = options.iceServers ?? [
      { urls: "stun:stun.l.google.com:19302" },
    ];
    this.localStream = options.localStream ?? null;
  }

  async initialize(): Promise<MediaStream> {
    if (!this.pc) {
      this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.pc.onicecandidate = (event) => {
        if (event.candidate) this.onIceCandidate?.(event.candidate);
      };
      this.pc.ontrack = (event) => {
        this.onRemoteStream?.(event.streams[0]);
      };
      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState;
        if (state) this.onConnectionStateChange?.(state);
      };
    }
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    this.localStream.getTracks().forEach((track) => {
      if (this.pc) this.pc.addTrack(track, this.localStream!);
    });
    return this.localStream;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("Call not initialized");
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("Call not initialized");
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error("Call not initialized");
    await this.pc.setRemoteDescription(description);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) throw new Error("Call not initialized");
    await this.pc.addIceCandidate(candidate);
  }

  muteAudio(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  muteVideo(muted: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = !muted));
  }

  async switchCamera(): Promise<void> {
    const tracks = this.localStream?.getVideoTracks() ?? [];
    for (const track of tracks) {
      // @ts-expect-error - switchCamera is supported by most modern browsers
      await track._switchCamera?.();
    }
  }

  endCall(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.pc = null;
  }

  get localMediaStream(): MediaStream | null {
    return this.localStream;
  }
}

/** Default signaling event names re-exported for convenience. */
export const CALL_SIGNALING_EVENTS = {
  offer: RealtimeEvent.CallOffer,
  answer: RealtimeEvent.CallAnswer,
  ice: RealtimeEvent.IceCandidate,
};
