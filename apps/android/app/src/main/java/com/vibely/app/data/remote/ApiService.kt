package com.vibely.app.data.remote

import com.vibely.app.data.remote.dto.AcceptMatchResponse
import com.vibely.app.data.remote.dto.ApiEnvelope
import com.vibely.app.data.remote.dto.AuthResponse
import com.vibely.app.data.remote.dto.BlockedUserResponse
import com.vibely.app.data.remote.dto.CallHistoryResponse
import com.vibely.app.data.remote.dto.CallInitiateRequest
import com.vibely.app.data.remote.dto.CallResponse
import com.vibely.app.data.remote.dto.ChatPriceStatusResponse
import com.vibely.app.data.remote.dto.SetChatPriceRequest
import com.vibely.app.data.remote.dto.ChatMessagesResponse
import com.vibely.app.data.remote.dto.ChatSummaryResponse
import com.vibely.app.data.remote.dto.CreateFamilyRequest
import com.vibely.app.data.remote.dto.CreatePaymentRequest
import com.vibely.app.data.remote.dto.CreatePaymentResponse
import com.vibely.app.data.remote.dto.FamilyDetailResponse
import com.vibely.app.data.remote.dto.FamilyLeaderboardEntry
import com.vibely.app.data.remote.dto.FamilySummaryResponse
import com.vibely.app.data.remote.dto.GiftResponse
import com.vibely.app.data.remote.dto.LeaderboardEntry
import com.vibely.app.data.remote.dto.LeaderboardEntryResponse
import com.vibely.app.data.remote.dto.LevelStatusResponse
import com.vibely.app.data.remote.dto.LiveRoomResponse
import com.vibely.app.data.remote.dto.LiveSessionResponse
import com.vibely.app.data.remote.dto.LoginRequest
import com.vibely.app.data.remote.dto.MallEquipRequest
import com.vibely.app.data.remote.dto.MallEquipResponse
import com.vibely.app.data.remote.dto.MallInventoryItemResponse
import com.vibely.app.data.remote.dto.MallItemResponse
import com.vibely.app.data.remote.dto.MallPurchaseRequest
import com.vibely.app.data.remote.dto.MatchResponse
import com.vibely.app.data.remote.dto.MatchStartRequest
import com.vibely.app.data.remote.dto.BadgesResponse
import com.vibely.app.data.remote.dto.NotificationsListResponse
import com.vibely.app.data.remote.dto.PartyRoomResponse
import com.vibely.app.data.remote.dto.PartySeatActionResponse
import com.vibely.app.data.remote.dto.PartySessionResponse
import com.vibely.app.data.remote.dto.ReferralInfoResponse
import com.vibely.app.data.remote.dto.RegisterRequest
import com.vibely.app.data.remote.dto.RequestWithdrawalBody
import com.vibely.app.data.remote.dto.SearchResultsResponse
import com.vibely.app.data.remote.dto.SendGiftRequest
import com.vibely.app.data.remote.dto.SendGiftResponse
import com.vibely.app.data.remote.dto.SendMessageRequest
import com.vibely.app.data.remote.dto.SetFeaturedBadgeRequest
import com.vibely.app.data.remote.dto.SetFeaturedBadgeResponse
import com.vibely.app.data.remote.dto.SimpleSuccessResponse
import com.vibely.app.data.remote.dto.StartChatRequest
import com.vibely.app.data.remote.dto.StartChatResponse
import com.vibely.app.data.remote.dto.StartLiveRequest
import com.vibely.app.data.remote.dto.StartPartyRequest
import com.vibely.app.data.remote.dto.TaskClaimRequest
import com.vibely.app.data.remote.dto.TaskClaimResponse
import com.vibely.app.data.remote.dto.TaskResponse
import com.vibely.app.data.remote.dto.UserResponse
import com.vibely.app.data.remote.dto.VerifyPaymentRequestBody
import com.vibely.app.data.remote.dto.VerifyPaymentResponseBody
import com.vibely.app.data.remote.dto.VipPurchaseRequest
import com.vibely.app.data.remote.dto.VipStatusResponse
import com.vibely.app.data.remote.dto.VipTierResponse
import com.vibely.app.data.remote.dto.WalletResponse
import com.vibely.app.data.remote.dto.WithdrawalListResponse
import com.vibely.app.data.remote.dto.WithdrawalResponse
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("auth/register")
    suspend fun register(@Body dto: RegisterRequest): ApiEnvelope<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body dto: LoginRequest): ApiEnvelope<AuthResponse>

    @POST("auth/verify-email")
    suspend fun verifyEmail(@Body body: Map<String, String>): ApiEnvelope<Any>

    @GET("users/me")
    suspend fun getCurrentUser(): ApiEnvelope<UserResponse>

    @GET("users")
    suspend fun listUsers(): ApiEnvelope<List<UserResponse>>

    @GET("users/search")
    suspend fun searchUsers(
        @Query("q") q: String? = null,
        @Query("gender") gender: String? = null,
        @Query("country") country: String? = null,
        @Query("onlineOnly") onlineOnly: Boolean? = null,
        @Query("ageMin") ageMin: Int? = null,
        @Query("ageMax") ageMax: Int? = null,
    ): ApiEnvelope<SearchResultsResponse>

    @POST("matching/start")
    suspend fun startMatch(@Body dto: MatchStartRequest): ApiEnvelope<MatchResponse>

    @POST("matching/accept")
    suspend fun acceptMatch(@Body body: Map<String, String>): ApiEnvelope<AcceptMatchResponse>

    @POST("matching/cancel")
    suspend fun cancelMatch(): ApiEnvelope<Any>

    @POST("matching/decline")
    suspend fun declineMatch(@Body body: Map<String, String>): ApiEnvelope<Any>

    @POST("matching/skip")
    suspend fun skipMatch(@Body body: Map<String, String>): ApiEnvelope<Any>

    @GET("wallet")
    suspend fun getWallet(): ApiEnvelope<WalletResponse>

    @POST("payments/create")
    suspend fun createPayment(@Body dto: CreatePaymentRequest): ApiEnvelope<CreatePaymentResponse>

    @POST("payments/{paymentId}/verify")
    suspend fun verifyPayment(@Path("paymentId") paymentId: String, @Body dto: VerifyPaymentRequestBody): ApiEnvelope<VerifyPaymentResponseBody>

    @GET("vip/tiers")
    suspend fun getVipTiers(): ApiEnvelope<List<VipTierResponse>>

    @GET("vip/status")
    suspend fun getVipStatus(): ApiEnvelope<VipStatusResponse>

    @POST("vip/purchase")
    suspend fun purchaseVip(@Body dto: VipPurchaseRequest): ApiEnvelope<VipStatusResponse>

    @POST("calls/initiate")
    suspend fun initiateCall(@Body dto: CallInitiateRequest): ApiEnvelope<CallResponse>

    @POST("calls/{callId}/accept")
    suspend fun acceptCall(@Path("callId") callId: String): ApiEnvelope<Any>

    @POST("calls/{callId}/reject")
    suspend fun rejectCall(@Path("callId") callId: String): ApiEnvelope<Any>

    @POST("calls/{callId}/end")
    suspend fun endCall(@Path("callId") callId: String): ApiEnvelope<Any>

    @GET("calls/history")
    suspend fun callHistory(): ApiEnvelope<CallHistoryResponse>

    @POST("live/start")
    suspend fun startLive(@Body dto: StartLiveRequest): ApiEnvelope<LiveSessionResponse>

    @POST("live/{id}/end")
    suspend fun endLive(@Path("id") roomId: String): ApiEnvelope<Any>

    @GET("live")
    suspend fun listLiveRooms(): ApiEnvelope<List<LiveRoomResponse>>

    @GET("live/{id}/join")
    suspend fun joinLive(@Path("id") roomId: String): ApiEnvelope<LiveSessionResponse>

    @POST("party/start")
    suspend fun startParty(@Body dto: StartPartyRequest): ApiEnvelope<PartySessionResponse>

    @POST("party/{id}/end")
    suspend fun endParty(@Path("id") roomId: String): ApiEnvelope<Any>

    @GET("party")
    suspend fun listPartyRooms(): ApiEnvelope<List<PartyRoomResponse>>

    @GET("party/{id}/join")
    suspend fun joinParty(@Path("id") roomId: String): ApiEnvelope<PartySessionResponse>

    @POST("party/{id}/leave")
    suspend fun leaveParty(@Path("id") roomId: String): ApiEnvelope<Any>

    @POST("party/{id}/seats/{seatIndex}/take")
    suspend fun takePartySeat(@Path("id") roomId: String, @Path("seatIndex") seatIndex: Int): ApiEnvelope<PartySeatActionResponse>

    @POST("party/{id}/seats/leave")
    suspend fun leavePartySeat(@Path("id") roomId: String): ApiEnvelope<PartySeatActionResponse>

    @POST("withdrawals")
    suspend fun requestWithdrawal(@Body dto: RequestWithdrawalBody): ApiEnvelope<WithdrawalResponse>

    @GET("withdrawals/mine")
    suspend fun myWithdrawals(): ApiEnvelope<WithdrawalListResponse>

    @GET("leaderboard")
    suspend fun getLeaderboard(@Query("type") type: String, @Query("period") period: String): ApiEnvelope<List<LeaderboardEntryResponse>>

    @GET("gifts")
    suspend fun listGifts(): ApiEnvelope<List<GiftResponse>>

    @POST("gifts/send")
    suspend fun sendGift(@Body dto: SendGiftRequest): ApiEnvelope<SendGiftResponse>

    @GET("chat")
    suspend fun listChats(): ApiEnvelope<List<ChatSummaryResponse>>

    @POST("chat/start")
    suspend fun startChat(@Body dto: StartChatRequest): ApiEnvelope<StartChatResponse>

    @GET("chat/{chatId}/messages")
    suspend fun getChatMessages(@Path("chatId") chatId: String): ApiEnvelope<ChatMessagesResponse>

    @POST("chat/message")
    suspend fun sendChatMessage(@Body dto: SendMessageRequest): ApiEnvelope<Any>

    @GET("notifications")
    suspend fun listNotifications(): ApiEnvelope<NotificationsListResponse>

    @POST("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): ApiEnvelope<Any>

    @POST("notifications/read-all")
    suspend fun markAllNotificationsRead(): ApiEnvelope<Any>

    @GET("tasks")
    suspend fun listTasks(): ApiEnvelope<List<TaskResponse>>

    @POST("tasks/claim")
    suspend fun claimTask(@Body dto: TaskClaimRequest): ApiEnvelope<TaskClaimResponse>

    @GET("referrals/me")
    suspend fun getReferralInfo(): ApiEnvelope<ReferralInfoResponse>

    @GET("blocks")
    suspend fun listBlockedUsers(): ApiEnvelope<List<BlockedUserResponse>>

    @DELETE("blocks/{userId}")
    suspend fun unblockUser(@Path("userId") userId: String): ApiEnvelope<Any>

    @GET("levels/me")
    suspend fun getLevelStatus(): ApiEnvelope<LevelStatusResponse>

    @GET("levels/leaderboard")
    suspend fun getLevelLeaderboard(): ApiEnvelope<List<LeaderboardEntry>>

    @GET("badges/me")
    suspend fun getMyBadges(): ApiEnvelope<BadgesResponse>

    @POST("badges/featured")
    suspend fun setFeaturedBadge(@Body dto: SetFeaturedBadgeRequest): ApiEnvelope<SetFeaturedBadgeResponse>

    @GET("mall/items")
    suspend fun getMallItems(): ApiEnvelope<List<MallItemResponse>>

    @GET("mall/inventory")
    suspend fun getMallInventory(): ApiEnvelope<List<MallInventoryItemResponse>>

    @POST("mall/purchase")
    suspend fun purchaseMallItem(@Body dto: MallPurchaseRequest): ApiEnvelope<MallInventoryItemResponse>

    @POST("mall/equip")
    suspend fun equipMallItem(@Body dto: MallEquipRequest): ApiEnvelope<MallEquipResponse>

    @POST("mall/unequip")
    suspend fun unequipMallItem(@Body dto: MallEquipRequest): ApiEnvelope<MallEquipResponse>

    @GET("families")
    suspend fun listFamilies(@Query("search") search: String? = null): ApiEnvelope<List<FamilySummaryResponse>>

    @GET("families/me")
    suspend fun getMyFamily(): ApiEnvelope<FamilyDetailResponse?>

    @GET("families/{id}")
    suspend fun getFamily(@Path("id") id: String): ApiEnvelope<FamilyDetailResponse>

    @GET("families/{id}/leaderboard")
    suspend fun getFamilyLeaderboard(@Path("id") id: String): ApiEnvelope<List<FamilyLeaderboardEntry>>

    @POST("families")
    suspend fun createFamily(@Body dto: CreateFamilyRequest): ApiEnvelope<FamilyDetailResponse>

    @POST("families/{id}/join")
    suspend fun joinFamily(@Path("id") id: String): ApiEnvelope<FamilyDetailResponse>

    @POST("families/leave")
    suspend fun leaveFamily(): ApiEnvelope<SimpleSuccessResponse>

    @DELETE("families/mine")
    suspend fun disbandFamily(): ApiEnvelope<SimpleSuccessResponse>

    @GET("chat-price/me")
    suspend fun getChatPriceStatus(): ApiEnvelope<ChatPriceStatusResponse>

    @POST("chat-price")
    suspend fun setChatPrice(@Body dto: SetChatPriceRequest): ApiEnvelope<ChatPriceStatusResponse>
}
