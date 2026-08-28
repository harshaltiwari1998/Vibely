package com.vibely.app.data.remote

import com.vibely.app.data.remote.model.AuthResponse
import com.vibely.app.data.remote.model.AvatarRequest
import com.vibely.app.data.remote.model.ChangePasswordRequest
import com.vibely.app.data.remote.model.ForgotPasswordRequest
import com.vibely.app.data.remote.model.GiftDto
import com.vibely.app.data.remote.model.LoginRequest
import com.vibely.app.data.remote.model.ProfileDto
import com.vibely.app.data.remote.model.PublicProfileDto
import com.vibely.app.data.remote.model.RefreshTokenRequest
import com.vibely.app.data.remote.model.RegisterRequest
import com.vibely.app.data.remote.model.ResetPasswordRequest
import com.vibely.app.data.remote.model.UpdatePreferencesRequest
import com.vibely.app.data.remote.model.UpdateProfileRequest
import com.vibely.app.data.remote.model.UpdateUserRequest
import com.vibely.app.data.remote.model.UserDto
import com.vibely.app.data.remote.model.BlockResponse
import com.vibely.app.data.remote.model.FavoriteResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.Map

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<UserDto>

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshTokenRequest): Response<AuthResponse>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): Response<Unit>

    @POST("auth/logout")
    suspend fun logout(@Header("Authorization") auth: String): Response<Unit>

    @POST("auth/change-password")
    suspend fun changePassword(@Header("Authorization") auth: String, @Body body: ChangePasswordRequest): Response<Unit>

    @GET("users/me")
    suspend fun me(@Header("Authorization") auth: String): Response<UserDto>

    @POST("users/me")
    suspend fun updateMe(@Header("Authorization") auth: String, @Body body: UpdateUserRequest): Response<UserDto>

    @POST("users/me/profile")
    suspend fun updateProfile(@Header("Authorization") auth: String, @Body body: UpdateProfileRequest): Response<ProfileDto>

    @POST("users/me/avatar")
    suspend fun updateAvatar(@Header("Authorization") auth: String, @Body body: AvatarRequest): Response<Unit>

    @POST("users/me/preferences")
    suspend fun updatePreferences(@Header("Authorization") auth: String, @Body body: UpdatePreferencesRequest): Response<Unit>

    @GET("users/me/sessions")
    suspend fun sessions(@Header("Authorization") auth: String): Response<List<UserDto>>

    @DELETE("users/me/sessions/{id}")
    suspend fun revokeSession(@Header("Authorization") auth: String, @Path("id") sessionId: String): Response<Unit>

    @GET("profiles/discover")
    suspend fun discover(
        @Header("Authorization") auth: String,
        @Query("country") country: String? = null,
        @Query("language") language: String? = null,
        @Query("gender") gender: String? = null,
        @Query("online") online: Boolean? = null,
        @Query("minAge") minAge: Int? = null,
        @Query("maxAge") maxAge: Int? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null,
    ): Response<List<PublicProfileDto>>

    @POST("favorites/{userId}")
    suspend fun favorite(@Header("Authorization") auth: String, @Path("userId") userId: String): Response<FavoriteResponse>

    @DELETE("favorites/{userId}")
    suspend fun unfavorite(@Header("Authorization") auth: String, @Path("userId") userId: String): Response<Unit>

    @GET("favorites")
    suspend fun favorites(@Header("Authorization") auth: String): Response<List<FavoriteResponse>>

    @POST("blocks/{userId}")
    suspend fun block(@Header("Authorization") auth: String, @Path("userId") userId: String): Response<BlockResponse>

    @DELETE("blocks/{userId}")
    suspend fun unblock(@Header("Authorization") auth: String, @Path("userId") userId: String): Response<Unit>

    @GET("blocks")
    suspend fun blocks(@Header("Authorization") auth: String): Response<List<BlockResponse>>

    @GET("gifts")
    suspend fun gifts(@Header("Authorization") auth: String): Response<List<GiftDto>>

    @GET("wallet")
    suspend fun wallet(@Header("Authorization") auth: String): Response<Map<String, Int>>

    @GET("notifications")
    suspend fun notifications(@Header("Authorization") auth: String): Response<List<Map<String, Any>>>

    @POST("matching/start")
    suspend fun matchStart(@Header("Authorization") auth: String, @Body body: Map<String, Any>): Response<Map<String, String>>

    @POST("matching/cancel")
    suspend fun matchCancel(@Header("Authorization") auth: String): Response<Map<String, String>>

    @POST("matching/accept")
    suspend fun matchAccept(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, String>>

    @POST("matching/decline")
    suspend fun matchDecline(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, String>>

    @POST("matching/skip")
    suspend fun matchSkip(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, String>>

    @GET("chat")
    suspend fun listChats(@Header("Authorization") auth: String): Response<List<Map<String, Any>>>

    @GET("chat/{chatId}/messages")
    suspend fun getChatMessages(@Header("Authorization") auth: String, @Path("chatId") chatId: String): Response<List<Map<String, Any>>>

    @POST("chat/message")
    suspend fun sendChatMessage(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("chat/block")
    suspend fun block(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("chat/unblock")
    suspend fun unblock(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("chat/report-message")
    suspend fun reportMessage(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("chat/report-user")
    suspend fun reportUser(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    @GET("wallet")
    suspend fun wallet(@Header("Authorization") auth: String): Response<Map<String, Any>>

    @GET("wallet/transactions")
    suspend fun walletTransactions(@Header("Authorization") auth: String): Response<Map<String, Any>>

    @GET("gifts")
    suspend fun gifts(@Header("Authorization") auth: String): Response<List<Map<String, Any>>>

    @GET("gifts/history")
    suspend fun giftHistory(@Header("Authorization") auth: String): Response<Map<String, Any>>

    @GET("payments/packages")
    suspend fun packages(@Header("Authorization") auth: String): Response<List<Map<String, Any>>>

    @GET("calls/history")
    suspend fun callHistory(@Header("Authorization") auth: String): Response<Map<String, Any>>

    @GET("notifications")
    suspend fun notifications(@Header("Authorization") auth: String): Response<List<Map<String, Any>>>

    @POST("notifications/{id}/read")
    suspend fun markNotificationRead(@Header("Authorization") auth: String, @Path("id") id: String): Response<Map<String, Any>>

    @POST("notifications/{id}/delete")
    suspend fun deleteNotification(@Header("Authorization") auth: String, @Path("id") id: String): Response<Map<String, Any>>

    @POST("devices")
    suspend fun registerDevice(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("translation/translate")
    suspend fun translate(@Header("Authorization") auth: String, @Body body: Map<String, String>): Response<Map<String, Any>>

    companion object
}
