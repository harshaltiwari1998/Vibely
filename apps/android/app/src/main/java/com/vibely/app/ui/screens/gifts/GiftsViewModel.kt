package com.vibely.app.ui.screens.gifts

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.SocketManager
import com.vibely.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject

data class Gift(
    val id: String,
    val name: String,
    val iconUrl: String,
    val coinCost: Int,
    val active: Boolean,
)

data class GiftUiState(
    val gifts: List<Map<String, Any>> = emptyList(),
    val balance: Int = 0,
    val history: Map<String, Any> = emptyMap(),
    val error: String? = null,
)

class GiftsViewModel(
    private val context: Context,
    private val session: SessionPreferences,
    private val socketManager: SocketManager,
    private val api: ApiService,
) : ViewModel() {
    private val _state = MutableStateFlow(GiftUiState())
    val state: StateFlow<GiftUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val token = session.accessToken.first()
            if (!token.isNullOrBlank()) {
                socketManager.connect("Bearer $token", object : SocketManager.SocketListener {
                    override fun onConnected() {}
                    override fun onDisconnected() {}
                    override fun onError(message: String) {
                        _state.update { copy(error = message) }
                    }

                    override fun onMatchSearching() {}
                    override fun onMatchFound(matchId: String, peerId: String) {}
                    override fun onMatchCancelled(matchId: String, reason: String?) {}
                    override fun onMatchExpired(matchId: String, reason: String?) {}
                })
            }
        }
    }

    fun loadGifts() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.gifts("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body ?: emptyList()
                    _state.update { copy(gifts = items) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun loadBalance() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.wallet("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    _state.update { copy(balance = body?.optInt("balance") ?: 0) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.giftHistory("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    _state.update { copy(history = body ?: emptyMap()) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun sendGift(recipientId: String, giftId: String) {
        if (recipientId.isBlank()) return
        viewModelScope.launch {
            try {
                val body = JSONObject()
                body.put("receiverId", recipientId)
                body.put("giftId", giftId)
                socketManager.send("gift_sent", body)
                loadBalance()
                loadHistory()
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketManager.disconnect()
    }

    private fun MutableStateFlow<GiftUiState>.update(block: GiftUiState.() -> GiftUiState) {
        value = value.block()
    }
}
