import { CallType, OnlineStatus } from "./enums";

/**
 * Minimal WebRTC signal payload types. Defined locally so the package is
 * self-contained and does not require DOM lib at compile time. They mirror the
 * browser `RTCSessionDescriptionInit` / `RTCIceCandidateInit` shapes used by
 * clients in Part 2.
 */
export interface RTCSessionDescriptionInit {
  type?: "offer" | "pranswer" | "answer" | "rollback";
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

/**
 * WebSocket real-time event contract shared by backend gateway and clients.
 * This is the architecture definition only; handlers are implemented in Part 2.
 */

export enum RealtimeEvent {
  // Presence
  UserConnected = "user_connected",
  UserDisconnected = "user_disconnected",
  UserOnline = "user_online",
  UserOffline = "user_offline",

  // Matching
  MatchRequest = "match_request",
  MatchFound = "match_found",
  MatchCancelled = "match_cancelled",
  MatchStart = "match_start",
  MatchCancel = "match_cancel",
  MatchAccept = "match_accept",
  MatchDecline = "match_decline",
  MatchSearching = "match_searching",
  MatchExpired = "match_expired",
  MatchRequestIncoming = "match_request_incoming",
  MatchRequestClosed = "match_request_closed",

  // WebRTC signaling
  CallOffer = "call_offer",
  CallAnswer = "call_answer",
  IceCandidate = "ice_candidate",

  // Call lifecycle
  CallStarted = "call_started",
  CallEnded = "call_ended",
  CallReady = "call_ready",
  CallReconnect = "call_reconnect",
  CallFailed = "call_failed",

  // Chat
  TypingStarted = "typing_started",
  TypingStopped = "typing_stopped",
  MessageSent = "message_sent",
  MessageDelivered = "message_delivered",
  MessageRead = "message_read",

  // Gifts
  GiftSent = "gift_sent",
  GiftReceived = "gift_received",

  // Payments
  PaymentCreated = "payment_created",
  PaymentSucceeded = "payment_succeeded",
  PaymentFailed = "payment_failed",

  // Notifications
  NotificationCreated = "notification_created",
  NotificationRead = "notification_read",
  NotificationDeleted = "notification_deleted",

  // Live streaming
  LiveViewerJoined = "live_viewer_joined",
  LiveViewerLeft = "live_viewer_left",
  LiveChatMessage = "live_chat_message",
  LiveGiftSent = "live_gift_sent",
  LiveEnded = "live_ended",

  // Party rooms
  PartyMemberJoined = "party_member_joined",
  PartyMemberLeft = "party_member_left",
  PartySeatUpdated = "party_seat_updated",
  PartyChatMessage = "party_chat_message",
  PartyEnded = "party_ended",
  PartySeatToken = "party_seat_token",
}

export interface PresencePayload {
  userId: string;
  status: OnlineStatus;
  at: string;
}

export interface MatchRequestPayload {
  preferredGender?: string | null;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
}

export interface MatchSearchingPayload {
  matchId: string;
}

export interface MatchCancelPayload {
  matchId: string;
}

export interface MatchStartPayload {
  matchId: string;
  peerId: string;
}

export interface MatchAcceptPayload {
  matchId: string;
}

export interface MatchDeclinePayload {
  matchId: string;
}

export interface MatchExpiredPayload {
  matchId: string;
  reason?: string;
}

export interface MatchRequestIncomingPayload {
  matchId: string;
  requesterId: string;
  requesterUsername: string;
  requesterAvatarUrl?: string | null;
}

export interface MatchRequestClosedPayload {
  matchId: string;
}

export interface MatchFoundPayload {
  matchId: string;
  peerId: string;
  callType: CallType;
}

export interface MatchCancelledPayload {
  matchId: string;
  reason?: string;
}

export interface CallOfferPayload {
  callId: string;
  fromUserId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface CallAnswerPayload {
  callId: string;
  fromUserId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  callId: string;
  fromUserId: string;
  candidate: RTCIceCandidateInit;
}

export interface CallReadyPayload {
  callId: string;
}

export interface CallStartedPayload {
  callId: string;
  initiatorId: string;
  receiverId: string;
  type: CallType;
}

export interface CallEndedPayload {
  callId: string;
  durationSeconds: number;
  reason?: string;
}

export interface CallReconnectPayload {
  callId: string;
}

export interface CallFailedPayload {
  callId: string;
  reason?: string;
}

export interface TypingPayload {
  chatId: string;
  userId: string;
}

export interface MessageSentPayload {
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface MessageDeliveredPayload {
  messageId: string;
  chatId: string;
}

export interface MessageReadPayload {
  messageId: string;
  chatId: string;
  userId: string;
}

export interface GiftSentPayload {
  giftId: string;
  senderId: string;
  receiverId: string;
  coinAmount: number;
}

export interface GiftReceivedPayload {
  giftId: string;
  senderId: string;
  receiverId: string;
  coinAmount: number;
}

export interface PaymentCreatedPayload {
  paymentId: string;
  amount: number;
  currency: string;
  coins: number;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  amount: number;
  currency: string;
  coins: number;
}

export interface PaymentFailedPayload {
  paymentId: string;
  reason?: string;
}

export interface NotificationCreatedPayload {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  data?: string;
}

export interface NotificationReadPayload {
  notificationId: string;
}

export interface NotificationDeletedPayload {
  notificationId: string;
}

export interface LiveViewerJoinedPayload {
  roomId: string;
  userId: string;
  username: string;
  viewerCount: number;
}

export interface LiveViewerLeftPayload {
  roomId: string;
  userId: string;
  viewerCount: number;
}

export interface LiveChatMessagePayload {
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface LiveGiftSentPayload {
  roomId: string;
  giftId: string;
  giftName: string;
  iconUrl: string;
  senderId: string;
  senderName: string;
  coinAmount: number;
}

export interface LiveEndedPayload {
  roomId: string;
}

export interface PartySeatInfo {
  seatIndex: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  muted: boolean;
}

export interface PartyMemberJoinedPayload {
  roomId: string;
  userId: string;
  username: string;
  memberCount: number;
}

export interface PartyMemberLeftPayload {
  roomId: string;
  userId: string;
  memberCount: number;
}

export interface PartySeatUpdatedPayload {
  roomId: string;
  seats: PartySeatInfo[];
}

export interface PartyChatMessagePayload {
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface PartyEndedPayload {
  roomId: string;
}

export interface PartySeatTokenPayload {
  roomId: string;
  token: string;
}

export type RealtimePayloadMap = {
  [RealtimeEvent.UserConnected]: PresencePayload;
  [RealtimeEvent.UserDisconnected]: PresencePayload;
  [RealtimeEvent.UserOnline]: PresencePayload;
  [RealtimeEvent.UserOffline]: PresencePayload;
  [RealtimeEvent.MatchRequest]: MatchRequestPayload;
  [RealtimeEvent.MatchFound]: MatchFoundPayload;
  [RealtimeEvent.MatchCancelled]: MatchCancelledPayload;
  [RealtimeEvent.MatchStart]: MatchStartPayload;
  [RealtimeEvent.MatchCancel]: MatchCancelPayload;
  [RealtimeEvent.MatchAccept]: MatchAcceptPayload;
  [RealtimeEvent.MatchDecline]: MatchDeclinePayload;
  [RealtimeEvent.MatchSearching]: MatchSearchingPayload;
  [RealtimeEvent.MatchExpired]: MatchExpiredPayload;
  [RealtimeEvent.MatchRequestIncoming]: MatchRequestIncomingPayload;
  [RealtimeEvent.MatchRequestClosed]: MatchRequestClosedPayload;
  [RealtimeEvent.CallOffer]: CallOfferPayload;
  [RealtimeEvent.CallAnswer]: CallAnswerPayload;
  [RealtimeEvent.IceCandidate]: IceCandidatePayload;
  [RealtimeEvent.CallStarted]: CallStartedPayload;
  [RealtimeEvent.CallEnded]: CallEndedPayload;
  [RealtimeEvent.CallReady]: CallReadyPayload;
  [RealtimeEvent.CallReconnect]: CallReconnectPayload;
  [RealtimeEvent.CallFailed]: CallFailedPayload;
  [RealtimeEvent.TypingStarted]: TypingPayload;
  [RealtimeEvent.TypingStopped]: TypingPayload;
  [RealtimeEvent.MessageSent]: MessageSentPayload;
  [RealtimeEvent.MessageDelivered]: MessageDeliveredPayload;
  [RealtimeEvent.MessageRead]: MessageReadPayload;
  [RealtimeEvent.GiftSent]: GiftSentPayload;
  [RealtimeEvent.GiftReceived]: GiftReceivedPayload;
  [RealtimeEvent.PaymentCreated]: PaymentCreatedPayload;
  [RealtimeEvent.PaymentSucceeded]: PaymentSucceededPayload;
  [RealtimeEvent.PaymentFailed]: PaymentFailedPayload;
  [RealtimeEvent.NotificationCreated]: NotificationCreatedPayload;
  [RealtimeEvent.NotificationRead]: NotificationReadPayload;
  [RealtimeEvent.NotificationDeleted]: NotificationDeletedPayload;
  [RealtimeEvent.LiveViewerJoined]: LiveViewerJoinedPayload;
  [RealtimeEvent.LiveViewerLeft]: LiveViewerLeftPayload;
  [RealtimeEvent.LiveChatMessage]: LiveChatMessagePayload;
  [RealtimeEvent.LiveGiftSent]: LiveGiftSentPayload;
  [RealtimeEvent.LiveEnded]: LiveEndedPayload;
  [RealtimeEvent.PartyMemberJoined]: PartyMemberJoinedPayload;
  [RealtimeEvent.PartyMemberLeft]: PartyMemberLeftPayload;
  [RealtimeEvent.PartySeatUpdated]: PartySeatUpdatedPayload;
  [RealtimeEvent.PartyChatMessage]: PartyChatMessagePayload;
  [RealtimeEvent.PartyEnded]: PartyEndedPayload;
  [RealtimeEvent.PartySeatToken]: PartySeatTokenPayload;
};
