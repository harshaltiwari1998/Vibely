package com.vibely.app.data.remote.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val identifier: String,
    val password: String,
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    @SerializedName("dateOfBirth") val dateOfBirth: String,
    val gender: String,
    val country: String,
    val language: String,
)

data class RefreshTokenRequest(val refreshToken: String)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String,
)

data class ForgotPasswordRequest(val email: String)

data class ResetPasswordRequest(
    val token: String,
    val password: String,
)

data class UpdateProfileRequest(
    val bio: String?,
    val interests: List<String>?,
)

data class UpdatePreferencesRequest(
    val preferredGender: String?,
    val preferredAgeMin: Int?,
    val preferredAgeMax: Int?,
    val preferredCountries: List<String>?,
    val preferredLanguages: List<String>?,
)

data class UpdateUserRequest(
    val country: String?,
    val language: String?,
    val gender: String?,
    val avatarUrl: String?,
)

data class AvatarRequest(val avatarUrl: String)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto?,
)

data class UserDto(
    val id: String,
    val username: String,
    val email: String,
    val status: String,
    val country: String?,
    val language: String?,
    val gender: String?,
    val avatarUrl: String?,
    val dateOfBirth: String?,
    val profile: ProfileDto?,
)

data class ProfileDto(
    val id: String,
    val userId: String,
    val bio: String?,
    val interests: List<String> = emptyList(),
    val onlineStatus: String?,
    val lastSeen: String?,
)

data class PublicProfileDto(
    val id: String,
    val username: String,
    val gender: String,
    val country: String,
    val language: String,
    val avatarUrl: String?,
    val bio: String?,
    val interests: List<String> = emptyList(),
    val onlineStatus: String?,
)

data class FavoriteResponse(
    val id: String,
    val ownerId: String,
    val targetUserId: String,
    val targetUser: PublicProfileDto?,
    val createdAt: String,
)

data class BlockResponse(
    val id: String,
    val blockerId: String,
    val blockedId: String,
    val blocked: PublicProfileDto?,
    val createdAt: String,
)

data class GiftDto(
    val id: String,
    val name: String,
    val iconUrl: String,
    val coinCost: Int,
)

data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T?,
    val message: String?,
)
