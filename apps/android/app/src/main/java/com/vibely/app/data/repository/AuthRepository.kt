package com.vibely.app.data.repository

import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.model.AuthResponse
import com.vibely.app.data.remote.model.ChangePasswordRequest
import com.vibely.app.data.remote.model.ForgotPasswordRequest
import com.vibely.app.data.remote.model.GiftDto
import com.vibely.app.data.remote.model.LoginRequest
import com.vibely.app.data.remote.model.ProfileDto
import com.vibely.app.data.remote.model.RegisterRequest
import com.vibely.app.data.remote.model.ResetPasswordRequest
import com.vibely.app.data.remote.model.UpdatePreferencesRequest
import com.vibely.app.data.remote.model.UpdateProfileRequest
import com.vibely.app.data.remote.model.UpdateUserRequest
import com.vibely.app.data.remote.model.AvatarRequest
import com.vibely.app.data.remote.model.RefreshTokenRequest
import com.vibely.app.data.remote.model.UserDto
import com.vibely.app.data.remote.model.BlockResponse
import com.vibely.app.data.remote.model.FavoriteResponse
import com.vibely.app.data.remote.model.PublicProfileDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response

class AuthRepository(
    private val api: ApiService,
    private val session: SessionPreferences,
) {
    suspend fun login(identifier: String, password: String): Result<AuthResponse> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.login(LoginRequest(identifier, password))
                if (!response.isSuccessful) throw IllegalStateException("Login failed")
                val body = response.body() ?: throw IllegalStateException("Empty response")
                session.saveSession(body.accessToken, body.refreshToken, body.user?.id ?: "")
                body
            }
        }

    suspend fun register(request: RegisterRequest): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.register(request)
                if (!response.isSuccessful) throw IllegalStateException("Registration failed")
            }
        }

    suspend fun logout(token: String) {
        runCatching { api.logout("Bearer $token") }
        session.clear()
    }

    suspend fun refreshToken(token: String): Result<AuthResponse> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.refresh(RefreshTokenRequest(token))
                if (!response.isSuccessful) throw IllegalStateException("Refresh failed")
                val body = response.body() ?: throw IllegalStateException("Empty response")
                session.saveSession(body.accessToken, body.refreshToken, body.user?.id ?: "")
                body
            }
        }

    suspend fun forgotPassword(email: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.forgotPassword(ForgotPasswordRequest(email))
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun resetPassword(token: String, password: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.resetPassword(ResetPasswordRequest(token, password))
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun changePassword(token: String, oldPassword: String, newPassword: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.changePassword("Bearer $token", ChangePasswordRequest(oldPassword, newPassword))
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun me(token: String): Result<UserDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.me("Bearer $token")
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: throw IllegalStateException("Empty response")
            }
        }

    suspend fun updateProfile(token: String, bio: String?, interests: List<String>?): Result<ProfileDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.updateProfile("Bearer $token", UpdateProfileRequest(bio, interests))
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: throw IllegalStateException("Empty response")
            }
        }

    suspend fun updatePreferences(token: String, prefs: UpdatePreferencesRequest): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.updatePreferences("Bearer $token", prefs)
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun updateAvatar(token: String, avatarUrl: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.updateAvatar("Bearer $token", AvatarRequest(avatarUrl))
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun updateMe(token: String, country: String?, language: String?, gender: String?, avatarUrl: String?): Result<UserDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.updateMe("Bearer $token", UpdateUserRequest(country, language, gender, avatarUrl))
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: throw IllegalStateException("Empty response")
            }
        }

    suspend fun favorite(token: String, userId: String): Result<FavoriteResponse> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.favorite("Bearer $token", userId)
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: throw IllegalStateException("Empty response")
            }
        }

    suspend fun unfavorite(token: String, userId: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.unfavorite("Bearer $token", userId)
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun fetchFavorites(token: String): Result<List<FavoriteResponse>> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.favorites("Bearer $token")
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: emptyList()
            }
        }

    suspend fun block(token: String, userId: String): Result<BlockResponse> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.block("Bearer $token", userId)
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: throw IllegalStateException("Empty response")
            }
        }

    suspend fun unblock(token: String, userId: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.unblock("Bearer $token", userId)
                if (!response.isSuccessful) throw IllegalStateException("Failed")
            }
        }

    suspend fun fetchBlocks(token: String): Result<List<BlockResponse>> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.blocks("Bearer $token")
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: emptyList()
            }
        }

    suspend fun discover(token: String, country: String? = null, language: String? = null, gender: String? = null, online: Boolean? = null, minAge: Int? = null, maxAge: Int? = null, page: Int? = null, limit: Int? = null): Result<List<PublicProfileDto>> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.discover("Bearer $token", country, language, gender, online, minAge, maxAge, page, limit)
                if (!response.isSuccessful) throw IllegalStateException("Failed")
                response.body() ?: emptyList()
            }
        }
}
