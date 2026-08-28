package com.vibely.app.ui.screens.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.local.SessionPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject

data class CallHistoryItem(
    val id: String,
    val initiatorUsername: String,
    val receiverUsername: String,
    val startedAt: String,
    val durationSeconds: Int,
    val status: String,
)

data class HistoryUiState(
    val calls: List<CallHistoryItem> = emptyList(),
    val error: String? = null,
)

class HistoryViewModel(
    private val session: SessionPreferences,
    private val api: ApiService,
) : ViewModel() {
    private val _state = MutableStateFlow(HistoryUiState())
    val state: StateFlow<HistoryUiState> = _state.asStateFlow()

    fun loadHistory() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.callHistory("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body?.optJSONArray("items") ?: body
                    val calls = mutableListOf<CallHistoryItem>()
                    for (i in 0 until (items?.length() ?: 0)) {
                        val obj = items?.getJSONObject(i)
                        val initiator = obj?.optJSONObject("initiator")
                        val receiver = obj?.optJSONObject("receiver")
                        calls.add(
                            CallHistoryItem(
                                id = obj?.optString("id") ?: continue,
                                initiatorUsername = initiator?.optString("username") ?: "Unknown",
                                receiverUsername = receiver?.optString("username") ?: "Unknown",
                                startedAt = obj.optString("startedAt"),
                                durationSeconds = obj.optInt("durationSeconds"),
                                status = obj.optString("status"),
                            ),
                        )
                    }
                    _state.update { copy(calls = calls) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    private fun MutableStateFlow<HistoryUiState>.update(block: HistoryUiState.() -> HistoryUiState) {
        value = value.block()
    }
}
