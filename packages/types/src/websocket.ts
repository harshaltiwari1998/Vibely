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
};
