package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.model.CallLog
import com.vibely.app.data.model.ChatMessage
import com.vibely.app.data.realtime.SocketManager
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.payment.RazorpayCheckoutBridge
import com.vibely.app.data.remote.dto.ChatSummaryResponse
import com.vibely.app.data.remote.dto.CreatePaymentRequest
import com.vibely.app.data.remote.dto.LiveRoomResponse
import com.vibely.app.data.remote.dto.MatchStartRequest
import com.vibely.app.data.remote.dto.NotificationResponse
import com.vibely.app.data.remote.dto.BlockedUserResponse
import com.vibely.app.data.remote.dto.GiftResponse
import com.vibely.app.data.remote.dto.ReferralInfoResponse
import com.vibely.app.data.remote.dto.SendGiftRequest
import com.vibely.app.data.remote.dto.SendMessageRequest
import com.vibely.app.data.remote.dto.StartChatRequest
import com.vibely.app.data.remote.dto.TaskClaimRequest
import com.vibely.app.data.remote.dto.TaskResponse
import com.vibely.app.data.remote.dto.UserResponse
import com.vibely.app.data.remote.dto.VerifyPaymentRequestBody
import com.vibely.app.data.remote.dto.VipPurchaseRequest
import com.vibely.app.data.remote.dto.VipStatusResponse
import com.vibely.app.data.remote.dto.VipTierResponse
import io.socket.client.Socket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

sealed class MatchUiState {
    object Idle : MatchUiState()
    object Searching : MatchUiState()
    data class CallStarting(val callId: String, val peerId: String, val isInitiator: Boolean) : MatchUiState()
    data class Error(val message: String) : MatchUiState()
}

data class CheckoutRequest(
    val paymentId: String,
    val orderId: String,
    val keyId: String,
    val amountPaise: Int,
    val currency: String,
    val diamonds: Int
)

class WalletViewModel(private val api: ApiService) : ViewModel() {
    private val _balance = MutableStateFlow<UiState<Int>>(UiState.Loading)
    val balance: StateFlow<UiState<Int>> = _balance.asStateFlow()

    private val _isPurchasing = MutableStateFlow(false)
    val isPurchasing: StateFlow<Boolean> = _isPurchasing.asStateFlow()

    private val _rechargeMessage = MutableStateFlow<String?>(null)
    val rechargeMessage: StateFlow<String?> = _rechargeMessage.asStateFlow()

    private val _checkoutRequest = MutableStateFlow<CheckoutRequest?>(null)
    val checkoutRequest: StateFlow<CheckoutRequest?> = _checkoutRequest.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            try {
                val resp = api.getWallet()
                if (resp.success && resp.data != null) {
                    _balance.value = UiState.Success(resp.data.balance)
                } else {
                    _balance.value = UiState.Error(resp.message ?: "Failed to load wallet")
                }
            } catch (e: Exception) {
                _balance.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    /** Creates a real Razorpay order; WalletScreen opens the Checkout SDK once [checkoutRequest] is set. */
    fun purchase(diamonds: Int, rupees: Int) {
        if (_isPurchasing.value) return
        viewModelScope.launch {
            _isPurchasing.value = true
            try {
                val resp = api.createPayment(CreatePaymentRequest(coins = diamonds, amount = rupees))
                val data = resp.data
                if (resp.success && data != null && !data.providerKeyId.isNullOrBlank()) {
                    RazorpayCheckoutBridge.onResult = { success, razorpayPaymentId, signature, errorMessage ->
                        onCheckoutResult(data.paymentId, success, razorpayPaymentId, signature, errorMessage)
                    }
                    _checkoutRequest.value = CheckoutRequest(
                        paymentId = data.paymentId,
                        orderId = data.providerRef,
                        keyId = data.providerKeyId,
                        amountPaise = data.amount * 100,
                        currency = data.currency,
                        diamonds = diamonds
                    )
                } else {
                    _rechargeMessage.value = resp.message ?: "Could not start payment"
                    _isPurchasing.value = false
                }
            } catch (e: Exception) {
                _rechargeMessage.value = e.message ?: "Network error"
                _isPurchasing.value = false
            }
        }
    }

    /** Called by WalletScreen right after it hands the request off to the Checkout SDK. */
    fun consumeCheckoutRequest() {
        _checkoutRequest.value = null
    }

    private fun onCheckoutResult(paymentId: String, success: Boolean, razorpayPaymentId: String?, signature: String?, errorMessage: String?) {
        RazorpayCheckoutBridge.onResult = null
        if (!success) {
            _rechargeMessage.value = errorMessage ?: "Payment cancelled"
            _isPurchasing.value = false
            return
        }
        viewModelScope.launch {
            try {
                val resp = api.verifyPayment(paymentId, VerifyPaymentRequestBody(providerPaymentId = razorpayPaymentId, signature = signature))
                if (resp.success && resp.data?.status == "SUCCEEDED") {
                    refresh()
                    _rechargeMessage.value = "Recharge successful! +${resp.data.coins} 💎"
                } else {
                    _rechargeMessage.value = "Payment could not be verified"
                }
            } catch (e: Exception) {
                _rechargeMessage.value = e.message ?: "Network error"
            } finally {
                _isPurchasing.value = false
            }
        }
    }

    fun consumeRechargeMessage() {
        _rechargeMessage.value = null
    }
}

class VipViewModel(private val api: ApiService) : ViewModel() {
    private val _tiers = MutableStateFlow<UiState<List<VipTierResponse>>>(UiState.Loading)
    val tiers: StateFlow<UiState<List<VipTierResponse>>> = _tiers.asStateFlow()

    private val _status = MutableStateFlow<UiState<VipStatusResponse>>(UiState.Loading)
    val status: StateFlow<UiState<VipStatusResponse>> = _status.asStateFlow()

    private val _isPurchasing = MutableStateFlow(false)
    val isPurchasing: StateFlow<Boolean> = _isPurchasing.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        loadTiers()
        loadStatus()
    }

    fun loadTiers() {
        viewModelScope.launch {
            try {
                val resp = api.getVipTiers()
                if (resp.success && resp.data != null) {
                    _tiers.value = UiState.Success(resp.data)
                } else {
                    _tiers.value = UiState.Error(resp.message ?: "Failed to load VIP tiers")
                }
            } catch (e: Exception) {
                _tiers.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun loadStatus() {
        viewModelScope.launch {
            try {
                val resp = api.getVipStatus()
                if (resp.success && resp.data != null) {
                    _status.value = UiState.Success(resp.data)
                } else {
                    _status.value = UiState.Error(resp.message ?: "Failed to load VIP status")
                }
            } catch (e: Exception) {
                _status.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun purchase(level: String, onWalletChanged: () -> Unit = {}) {
        if (_isPurchasing.value) return
        viewModelScope.launch {
            _isPurchasing.value = true
            try {
                val resp = api.purchaseVip(VipPurchaseRequest(level))
                if (resp.success && resp.data != null) {
                    _status.value = UiState.Success(resp.data)
                    _message.value = "You're now ${resp.data.level} VIP!"
                    onWalletChanged()
                } else {
                    _message.value = resp.message ?: "Purchase failed"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isPurchasing.value = false
            }
        }
    }

    fun consumeMessage() {
        _message.value = null
    }
}

class MatchViewModel(private val api: ApiService, private val accessToken: String?, private val myUserId: String?) : ViewModel() {
    private val _matchState = MutableStateFlow<MatchUiState>(MatchUiState.Idle)
    val matchState: StateFlow<MatchUiState> = _matchState.asStateFlow()

    val COST_PER_MATCH = 600
    private var socket: Socket? = null

    init {
        listenForUpdates()
    }

    private fun listenForUpdates() {
        val token = accessToken ?: return
        val sock = SocketManager.getDefaultSocket(ApiClient.socketBaseUrl(), token)
        socket = sock

        sock.on("match_searching") { _matchState.value = MatchUiState.Searching }
        sock.on("match_cancelled") { args ->
            val reason = (args.getOrNull(0) as? JSONObject)?.optString("reason")
            _matchState.value = MatchUiState.Error(reason ?: "Match request ended")
        }
        sock.on("match_expired") { args ->
            val reason = (args.getOrNull(0) as? JSONObject)?.optString("reason")
            _matchState.value = MatchUiState.Error(reason ?: "No one accepted in time")
        }
        sock.on("call_started") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            val initiatorId = data.optString("initiatorId")
            val receiverId = data.optString("receiverId")
            val isInitiator = myUserId != null && myUserId == initiatorId
            val peerId = if (isInitiator) receiverId else initiatorId
            _matchState.value = MatchUiState.CallStarting(
                callId = data.optString("callId"),
                peerId = peerId,
                isInitiator = isInitiator,
            )
        }
    }

    fun startMatch() {
        viewModelScope.launch {
            try {
                val resp = api.startMatch(MatchStartRequest())
                if (resp.success && resp.data != null) {
                    when (resp.data.status) {
                        "WAITING" -> _matchState.value = MatchUiState.Searching
                        "EXPIRED" -> _matchState.value = MatchUiState.Error("No one is available right now")
                        else -> _matchState.value = MatchUiState.Error("Unexpected status: ${resp.data.status}")
                    }
                } else {
                    _matchState.value = MatchUiState.Error(resp.message ?: "Match failed")
                }
            } catch (e: Exception) {
                _matchState.value = MatchUiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun cancelMatch() {
        viewModelScope.launch {
            try {
                api.cancelMatch()
            } catch (_: Exception) {
            }
            _matchState.value = MatchUiState.Idle
        }
    }

    fun resetToIdle() {
        _matchState.value = MatchUiState.Idle
    }
}

class MessagesViewModel(private val api: ApiService) : ViewModel() {
    private val _chats = MutableStateFlow<UiState<List<ChatSummaryResponse>>>(UiState.Loading)
    val chats: StateFlow<UiState<List<ChatSummaryResponse>>> = _chats.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _chats.value = UiState.Loading
            try {
                val resp = api.listChats()
                if (resp.success && resp.data != null) {
                    _chats.value = UiState.Success(resp.data)
                } else {
                    _chats.value = UiState.Error(resp.message ?: "Failed to load messages")
                }
            } catch (e: Exception) {
                _chats.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}

class ChatViewModel(private val api: ApiService, private val myUserId: String?) : ViewModel() {
    private val _messages = MutableStateFlow<UiState<List<ChatMessage>>>(UiState.Loading)
    val messages: StateFlow<UiState<List<ChatMessage>>> = _messages.asStateFlow()

    private val _input = MutableStateFlow("")
    val input: StateFlow<String> = _input.asStateFlow()

    private val _gifts = MutableStateFlow<List<GiftResponse>>(emptyList())
    val gifts: StateFlow<List<GiftResponse>> = _gifts.asStateFlow()

    private val _isSendingGift = MutableStateFlow(false)
    val isSendingGift: StateFlow<Boolean> = _isSendingGift.asStateFlow()

    private val _giftMessage = MutableStateFlow<String?>(null)
    val giftMessage: StateFlow<String?> = _giftMessage.asStateFlow()

    private var chatId: String? = null

    fun loadGifts() {
        viewModelScope.launch {
            try {
                val resp = api.listGifts()
                if (resp.success && resp.data != null) {
                    _gifts.value = resp.data
                }
            } catch (_: Exception) {
            }
        }
    }

    fun onInputChange(value: String) { _input.value = value }

    fun loadMessages(peerId: String) {
        viewModelScope.launch {
            _messages.value = UiState.Loading
            try {
                val startResp = api.startChat(StartChatRequest(peerId))
                val resolvedChatId = startResp.data?.id
                if (!startResp.success || resolvedChatId == null) {
                    _messages.value = UiState.Error(startResp.message ?: "Could not start chat")
                    return@launch
                }
                chatId = resolvedChatId
                val resp = api.getChatMessages(resolvedChatId)
                if (resp.success && resp.data != null) {
                    val mapped = resp.data.items.map {
                        ChatMessage(
                            id = it.id,
                            senderId = it.senderId,
                            receiverId = if (it.senderId == myUserId) peerId else myUserId.orEmpty(),
                            text = it.content
                        )
                    }
                    _messages.value = UiState.Success(mapped)
                } else {
                    _messages.value = UiState.Error(resp.message ?: "Failed to load messages")
                }
            } catch (e: Exception) {
                _messages.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun sendMessage(peerId: String) {
        viewModelScope.launch {
            val text = _input.value.trim()
            val activeChatId = chatId ?: return@launch
            if (text.isBlank()) return@launch
            _input.value = ""
            try {
                val resp = api.sendChatMessage(SendMessageRequest(activeChatId, text))
                if (resp.success) {
                    val msg = ChatMessage(
                        id = System.currentTimeMillis().toString(),
                        senderId = myUserId.orEmpty(),
                        receiverId = peerId,
                        text = text
                    )
                    val current = (_messages.value as? UiState.Success)?.data.orEmpty().toMutableList()
                    current.add(msg)
                    _messages.value = UiState.Success(current)
                }
            } catch (_: Exception) {
            }
        }
    }

    fun sendGift(peerId: String, giftId: String, onWalletChanged: () -> Unit = {}) {
        if (_isSendingGift.value) return
        viewModelScope.launch {
            _isSendingGift.value = true
            try {
                val resp = api.sendGift(SendGiftRequest(peerId, giftId))
                if (resp.success && resp.data != null) {
                    val gift = resp.data.gift
                    val msg = ChatMessage(
                        id = System.currentTimeMillis().toString(),
                        senderId = myUserId.orEmpty(),
                        receiverId = peerId,
                        text = "🎁 Sent ${gift.iconUrl} ${gift.name} (💎 ${resp.data.coinAmount})"
                    )
                    val current = (_messages.value as? UiState.Success)?.data.orEmpty().toMutableList()
                    current.add(msg)
                    _messages.value = UiState.Success(current)
                    _giftMessage.value = "Sent ${gift.name}!"
                    onWalletChanged()
                } else {
                    _giftMessage.value = resp.message ?: "Failed to send gift"
                }
            } catch (e: Exception) {
                _giftMessage.value = e.message ?: "Network error"
            } finally {
                _isSendingGift.value = false
            }
        }
    }

    fun consumeGiftMessage() {
        _giftMessage.value = null
    }
}

class NotificationsViewModel(private val api: ApiService) : ViewModel() {
    private val _notifications = MutableStateFlow<UiState<List<NotificationResponse>>>(UiState.Loading)
    val notifications: StateFlow<UiState<List<NotificationResponse>>> = _notifications.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _notifications.value = UiState.Loading
            try {
                val resp = api.listNotifications()
                if (resp.success && resp.data != null) {
                    _notifications.value = UiState.Success(resp.data.items)
                } else {
                    _notifications.value = UiState.Error(resp.message ?: "Failed to load notifications")
                }
            } catch (e: Exception) {
                _notifications.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun markRead(id: String) {
        viewModelScope.launch {
            try {
                api.markNotificationRead(id)
                val current = (_notifications.value as? UiState.Success)?.data.orEmpty()
                _notifications.value = UiState.Success(current.map { if (it.id == id) it.copy(read = true) else it })
            } catch (_: Exception) {
            }
        }
    }
}

class LiveFeedViewModel(private val api: ApiService) : ViewModel() {
    private val _rooms = MutableStateFlow<UiState<List<LiveRoomResponse>>>(UiState.Loading)
    val rooms: StateFlow<UiState<List<LiveRoomResponse>>> = _rooms.asStateFlow()

    init { load() }

    fun retry() = load()

    private fun load() {
        viewModelScope.launch {
            _rooms.value = UiState.Loading
            try {
                val resp = api.listLiveRooms()
                if (resp.success && resp.data != null) {
                    _rooms.value = UiState.Success(resp.data)
                } else {
                    _rooms.value = UiState.Error(resp.message ?: "Failed to load live rooms")
                }
            } catch (e: Exception) {
                _rooms.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}

class CallViewModel(private val api: ApiService) : ViewModel() {
    private val _history = MutableStateFlow<UiState<List<CallLog>>>(UiState.Loading)
    val history: StateFlow<UiState<List<CallLog>>> = _history.asStateFlow()

    init {
        viewModelScope.launch {
            try {
                val resp = api.callHistory()
                if (resp.success && resp.data != null) {
                    val logs = resp.data.items.map {
                        CallLog(
                            id = it.id,
                            userId = it.initiatorId,
                            type = if (it.type == "VIDEO") com.vibely.app.data.model.CallType.VIDEO else com.vibely.app.data.model.CallType.AUDIO,
                            status = com.vibely.app.data.model.CallStatus.valueOf(it.status),
                            timestamp = 0L,
                            durationSeconds = it.durationSeconds
                        )
                    }
                    _history.value = UiState.Success(logs)
                }
            } catch (e: Exception) {
                _history.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}

class TaskViewModel(private val api: ApiService) : ViewModel() {
    private val _tasks = MutableStateFlow<UiState<List<TaskResponse>>>(UiState.Loading)
    val tasks: StateFlow<UiState<List<TaskResponse>>> = _tasks.asStateFlow()

    private val _isClaiming = MutableStateFlow(false)
    val isClaiming: StateFlow<Boolean> = _isClaiming.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            try {
                val resp = api.listTasks()
                if (resp.success && resp.data != null) {
                    _tasks.value = UiState.Success(resp.data)
                } else {
                    _tasks.value = UiState.Error(resp.message ?: "Failed to load tasks")
                }
            } catch (e: Exception) {
                _tasks.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun claim(type: String, onWalletChanged: () -> Unit = {}) {
        if (_isClaiming.value) return
        viewModelScope.launch {
            _isClaiming.value = true
            try {
                val resp = api.claimTask(TaskClaimRequest(type))
                if (resp.success && resp.data != null) {
                    _message.value = "+${resp.data.reward} 💎 claimed!"
                    refresh()
                    onWalletChanged()
                } else {
                    _message.value = resp.message ?: "Could not claim task"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isClaiming.value = false
            }
        }
    }

    fun consumeMessage() {
        _message.value = null
    }
}

class ReferralViewModel(private val api: ApiService) : ViewModel() {
    private val _info = MutableStateFlow<UiState<ReferralInfoResponse>>(UiState.Loading)
    val info: StateFlow<UiState<ReferralInfoResponse>> = _info.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            try {
                val resp = api.getReferralInfo()
                if (resp.success && resp.data != null) {
                    _info.value = UiState.Success(resp.data)
                } else {
                    _info.value = UiState.Error(resp.message ?: "Failed to load referral info")
                }
            } catch (e: Exception) {
                _info.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}

class BlocklistViewModel(private val api: ApiService) : ViewModel() {
    private val _blocked = MutableStateFlow<UiState<List<BlockedUserResponse>>>(UiState.Loading)
    val blocked: StateFlow<UiState<List<BlockedUserResponse>>> = _blocked.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _blocked.value = UiState.Loading
            try {
                val resp = api.listBlockedUsers()
                if (resp.success && resp.data != null) {
                    _blocked.value = UiState.Success(resp.data)
                } else {
                    _blocked.value = UiState.Error(resp.message ?: "Failed to load blocked users")
                }
            } catch (e: Exception) {
                _blocked.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun unblock(userId: String) {
        viewModelScope.launch {
            try {
                api.unblockUser(userId)
                val current = (_blocked.value as? UiState.Success)?.data.orEmpty().filter { it.blocked.id != userId }
                _blocked.value = UiState.Success(current)
            } catch (_: Exception) {
            }
        }
    }
}
