/** Domain enumerations shared across web, admin, android and backend. */

export enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  NonBinary = "NON_BINARY",
  Other = "OTHER",
  PreferNotToSay = "PREFER_NOT_TO_SAY",
}

export enum UserStatus {
  Pending = "PENDING",
  Active = "ACTIVE",
  Suspended = "SUSPENDED",
  Banned = "BANNED",
}

export enum OnlineStatus {
  Online = "ONLINE",
  Offline = "OFFLINE",
  InCall = "IN_CALL",
  Busy = "BUSY",
}

export enum MatchStatus {
  Searching = "SEARCHING",
  Matched = "MATCHED",
  Cancelled = "CANCELLED",
  Expired = "EXPIRED",
}

export enum CallStatus {
  Initiated = "INITIATED",
  Ringing = "RINGING",
  Active = "ACTIVE",
  Ended = "ENDED",
  Missed = "MISSED",
  Rejected = "REJECTED",
  Failed = "FAILED",
}

export enum CallType {
  Video = "VIDEO",
  Audio = "AUDIO",
}

export enum MessageType {
  Text = "TEXT",
  Image = "IMAGE",
  Gift = "GIFT",
  System = "SYSTEM",
}

export enum ReportReason {
  Spam = "SPAM",
  Harassment = "HARASSMENT",
  Nudity = "NUDITY",
  HateSpeech = "HATE_SPEECH",
  Violence = "VIOLENCE",
  MinorSafety = "MINOR_SAFETY",
  Other = "OTHER",
}

export enum ReportStatus {
  Open = "OPEN",
  UnderReview = "UNDER_REVIEW",
  Resolved = "RESOLVED",
  Dismissed = "DISMISSED",
}

export enum TransactionType {
  Purchase = "PURCHASE",
  GiftSent = "GIFT_SENT",
  GiftReceived = "GIFT_RECEIVED",
  Refund = "REFUND",
  Bonus = "BONUS",
}

export enum PaymentStatus {
  Pending = "PENDING",
  Succeeded = "SUCCEEDED",
  Failed = "FAILED",
  Refunded = "REFUNDED",
}

export enum NotificationType {
  Match = "MATCH",
  Call = "CALL",
  Message = "MESSAGE",
  Gift = "GIFT",
  System = "SYSTEM",
  Report = "REPORT",
}
