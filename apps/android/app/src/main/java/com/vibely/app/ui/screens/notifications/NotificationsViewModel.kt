package com.vibely.app.ui.screens.notifications

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

data class NotificationItem(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val read: Boolean,
    val createdAt: String,
)

data class NotificationsUiState(
    val notifications: List<NotificationItem> = emptyList(),
    val error: String? = null,
)

class NotificationsViewModel(
    private val session: SessionPreferences,
    private val api: ApiService,
) : ViewModel() {
    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

    fun loadNotifications() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.notifications("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body ?: emptyList<Map<String, Any>>()
                    val notifications = items.mapNotNull { obj ->
                        val id = (obj as? Map<*, *>)?.get("id") as? String ?: return@mapNotNull null
                        NotificationItem(
                            id = id,
                            type = (obj["type"] as? String) ?: "",
                            title = (obj["title"] as? String) ?: "",
                            body = (obj["body"] as? String) ?: "",
                            read = (obj["read"] as? Boolean) ?: false,
                            createdAt = (obj["createdAt"] as? String) ?: "",
                        )
                    }
                    _state.update { copy(notifications = notifications) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun markRead(notificationId: String) {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                api.markNotificationRead("Bearer $token", notificationId)
                _state.update { state ->
                    copy(notifications = state.notifications.map { if (it.id == notificationId) it.copy(read = true) else it })
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun delete(notificationId: String) {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                api.deleteNotification("Bearer $token", notificationId)
                _state.update { state ->
                    copy(notifications = state.notifications.filter { it.id != notificationId })
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    private fun MutableStateFlow<NotificationsUiState>.update(block: NotificationsUiState.() -> NotificationsUiState) {
        value = value.block()
    }
}
