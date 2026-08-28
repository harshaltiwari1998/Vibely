# Realtime

Two Socket.IO gateways (NestJS `@nestjs/websockets`).

## Presence gateway — `RealtimeGateway` (namespace `/`)

| Event                | Direction | Payload | Purpose |
|----------------------|-----------|---------|---------|
| `user_connected`     | server→clients | `{userId, status, at}` | socket connected |
| `user_disconnected`  | server→clients | `{userId, status, at}` | socket gone |
| `user_online`        | client→server | `{userId}` | explicit online |
| `user_offline`       | client→server | `{userId}` | explicit offline |
| `match_request`      | client→server | `{preferredGender?, preferredAgeMin?, preferredAgeMax?}` | enqueue match |
| `match_found`        | server→client | `{matchId, peerId, callType}` | pair found |
| `match_cancelled`    | server→client | `{matchId, reason?}` | match ended |
| `typing_started`     | client↔server | `{chatId, userId}` | typing indicator |
| `typing_stopped`     | client↔server | `{chatId, userId}` | typing indicator |
| `message_sent`       | client→server | `{messageId, chatId, senderId, content, createdAt}` | chat message |
| `gift_sent`          | client→server | `{giftId, senderId, receiverId, coinAmount}` | gift event |

## Signaling gateway — `SignalingGateway` (namespace `/signal`)

Relays WebRTC negotiation between the two peers of a call.

| Event           | Payload | Purpose |
|-----------------|---------|---------|
| `call_offer`    | `{callId, fromUserId, sdp}` | SDP offer |
| `call_answer`   | `{callId, fromUserId, sdp}` | SDP answer |
| `ice_candidate` | `{callId, fromUserId, candidate}` | ICE candidate |

Targeting uses `PresenceService` (Redis-backed userId→socketId map).

## Client-side contract

Shared with clients via `@vibely/types` (`RealtimeEvent` enum +
`RealtimePayloadMap`). Web implements `VideoCallService` wrapping a single
`RTCPeerConnection` and consuming these events for signaling.

## Notes

- Event handlers in Part 1 define the **architecture only**; full
  matchmaking/call orchestration is Part 2.
- Presence map degrades gracefully when Redis is unavailable (logs only).
- Never send tokens, passwords or private message bodies over logs.
