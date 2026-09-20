package com.vibely.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserResponse,
    val message: String? = null
)

data class UserResponse(
    val id: String,
    val username: String,
    val email: String,
    val status: String,
    val gender: String? = null,
    val country: String? = null,
    val language: String? = null,
    val avatarUrl: String? = null,
    val dateOfBirth: String? = null
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val dateOfBirth: String,
    val gender: String,
    val country: String,
    val language: String
)

data class LoginRequest(
    val identifier: String,
    val password: String
)

data class MatchStartRequest(
    val preferredGender: String? = null,
    val preferredAgeMin: Int? = null,
    val preferredAgeMax: Int? = null
)

data class MatchResponse(
    val status: String,
    val matchId: String? = null
)

data class AcceptMatchResponse(
    val success: Boolean,
    val otherUserId: String,
    val callId: String
)

data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

data class WalletResponse(
    val id: String,
    val userId: String,
    val balance: Int
)

data class CallInitiateRequest(
    val receiverId: String
)

data class CallResponse(
    val id: String,
    val type: String,
    val status: String,
    val initiatorId: String,
    val receiverId: String,
    val startedAt: String,
    val endedAt: String? = null,
    val durationSeconds: Int = 0
)

data class CallHistoryResponse(
    val items: List<CallResponse>,
    val total: Int
)

data class AddCoinsRequest(
    val amount: Int
)

data class VipTierResponse(
    val level: String,
    val name: String,
    val cost: Int,
    val durationDays: Int,
    val perks: List<String>
)

data class VipStatusResponse(
    val level: String,
    val expiresAt: String? = null,
    val isActive: Boolean,
    val perks: List<String>
)

data class VipPurchaseRequest(
    val level: String
)

data class SendGiftRequest(
    val receiverId: String,
    val giftId: String
)

data class SendGiftResponse(
    val coinAmount: Int,
    val gift: GiftResponse
)
