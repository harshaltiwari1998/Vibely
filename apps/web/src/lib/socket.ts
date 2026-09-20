import { io, Socket } from "socket.io-client";

const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

let socket: Socket | null = null;
let currentToken: string | null = null;

let signalSocket: Socket | null = null;
let currentSignalToken: string | null = null;

/**
 * A single persistent connection to the default namespace, shared across
 * every page. Pages used to open their own `io(...)` connection each, so
 * navigating away from a page (e.g. Match -> Call) disconnected its socket
 * and the server's disconnect handler tore down the call/match that was
 * just starting, thinking the user had gone offline.
 */
export function getSocket(accessToken: string): Socket {
  // Reuse the existing socket even while it's still connecting - multiple
  // components (e.g. a page and a global modal) can call this within the
  // same tick, and each must get the *same* instance so their listeners
  // all end up on the connection that actually stays alive.
  if (socket && currentToken === accessToken) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
  }
  currentToken = accessToken;
  socket = io(wsUrl, {
    auth: { token: `Bearer ${accessToken}` },
    transports: ["websocket"],
  });
  return socket;
}

/**
 * WebRTC signaling (offer/answer/ICE, call ready/end/failed) is handled by
 * a separate NestJS gateway on the `/signal` namespace, not the default
 * one `getSocket()` connects to.
 */
export function getSignalSocket(accessToken: string): Socket {
  if (signalSocket && currentSignalToken === accessToken) {
    return signalSocket;
  }
  if (signalSocket) {
    signalSocket.disconnect();
  }
  currentSignalToken = accessToken;
  signalSocket = io(`${wsUrl}/signal`, {
    auth: { token: `Bearer ${accessToken}` },
    transports: ["websocket"],
  });
  return signalSocket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  currentToken = null;
  signalSocket?.disconnect();
  signalSocket = null;
  currentSignalToken = null;
}
