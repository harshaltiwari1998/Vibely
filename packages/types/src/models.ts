import {
  CallStatus,
  CallType,
  Gender,
  MatchStatus,
  MessageType,
  NotificationType,
  OnlineStatus,
  PaymentStatus,
  ReportReason,
  ReportStatus,
  TransactionType,
  UserStatus,
} from "./enums";

/** Core persisted entities (mirrors Prisma models where applicable). */

export interface User {
  id: string;
  username: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  country: string;
  language: string;
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string | null;
  interests: string[];
  onlineStatus: OnlineStatus;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  preferredGender?: Gender | null;
  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredCountries: string[];
  preferredLanguages: string[];
}

export interface PublicUser {
  id: string;
  username: string;
  gender: Gender;
  country: string;
  language: string;
  avatarUrl?: string | null;
  onlineStatus: OnlineStatus;
  bio?: string | null;
  interests: string[];
}

export interface Match {
  id: string;
  status: MatchStatus;
  initiatorId: string;
  matchedUserId?: string | null;
  createdAt: string;
  endedAt?: string | null;
}

export interface Call {
  id: string;
  type: CallType;
  status: CallStatus;
  initiatorId: string;
  receiverId: string;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string | null;
}

export interface Chat {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  ownerId: string;
  targetUserId: string;
  createdAt: string;
}

export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  coinCost: number;
  active: boolean;
}

export interface GiftTransaction {
  id: string;
  giftId: string;
  senderId: string;
  receiverId: string;
  coinAmount: number;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  provider: string;
  providerRef?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  platform: string;
  pushToken?: string | null;
  createdAt: string;
}

export interface UserBan {
  id: string;
  userId: string;
  reason: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  targetUserId: string;
  action: string;
  note?: string | null;
  createdAt: string;
}
