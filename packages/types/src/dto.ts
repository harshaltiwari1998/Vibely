import { Gender } from "./enums";

/** Authentication & user-facing request payloads. */

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: Gender;
  country: string;
  language: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    username: string;
    email: string;
    status: string;
  };
}

export interface UpdateProfileDto {
  bio?: string;
  interests?: string[];
}

export interface UpdatePreferencesDto {
  preferredGender?: Gender | null;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  preferredCountries?: string[];
  preferredLanguages?: string[];
}

export interface MatchRequestDto {
  preferredGender?: Gender | null;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
}

export interface SendMessageDto {
  chatId: string;
  content: string;
}

export interface SendGiftDto {
  receiverId: string;
  giftId: string;
}

export interface CreateReportDto {
  targetUserId: string;
  targetType: "USER" | "MESSAGE" | "PROFILE" | "CALL" | "GIFT" | "OTHER";
  targetId?: string;
  reason: string;
  description?: string;
}

export interface BlockUserDto {
  blockedId: string;
}

export interface UpdateReportDto {
  status?: string;
  assignedToId?: string;
  internalNotes?: string;
  resolution?: string;
}

export interface ModerationActionDto {
  targetUserId: string;
  action: "RESTRICT" | "SUSPEND" | "BAN" | "UNBAN";
  reason: string;
  note?: string;
  expiresAt?: string;
}
