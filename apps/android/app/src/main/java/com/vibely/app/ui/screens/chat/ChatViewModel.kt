package com.vibely.app.ui.screens.chat

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

data class ChatMessage(
    val id: String,
    val text: String,
    val fromMe: Boolean,
    val createdAt: String,
    val status: String = "SENT",
)

data class Conversation(
    val id: String,
    val peerId: String,
    val peerName: String,
    val lastMessage: String?,
    val updatedAt: String,
)

data class ChatUiState(
    val conversations: List<Conversation> = emptyList(),
    val messages: List<ChatMessage> = emptyList(),
    val activeChatId: String? = null,
    val error: String? = null,
    val translationMode: String = "original",
    val targetLanguage: String = "hi",
    val translations: Map<String, String> = emptyMap(),
)

class ChatViewModel(
    private val context: Context,
    private val session: SessionPreferences,
    private val socketManager: SocketManager,
    private val api: ApiService,
) : ViewModel() {
    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

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
                loadConversations()
            }
        }
    }

    fun openChat(chatId: String) {
        _state.update { copy(activeChatId = chatId) }
        loadMessages(chatId)
    }

    fun send(text: String) {
        if (text.isBlank() || _state.value.activeChatId == null) return
        val chatId = _state.value.activeChatId!!
        val optimistic = ChatMessage(
            id = "temp-${System.currentTimeMillis()}",
            text = text,
            fromMe = true,
            createdAt = "",
            status = "SENT",
        )
        _state.update { copy(messages = messages + optimistic) }

        viewModelScope.launch {
            try {
                val body = JSONObject()
                body.put("chatId", chatId)
                body.put("content", text)
                socketManager.send("message_sent", body)
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    private fun loadConversations() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.listChats("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body?.optJSONArray("items") ?: body
                    val convs = mutableListOf<Conversation>()
                    for (i in 0 until (items?.length() ?: 0)) {
                        val obj = items?.getJSONObject(i)
                        val peer = obj?.optJSONObject("peer")
                        val last = obj?.optJSONObject("lastMessage")
                        convs.add(
                            Conversation(
                                id = obj?.optString("id") ?: continue,
                                peerId = peer?.optString("id") ?: "",
                                peerName = peer?.optString("username") ?: "Unknown",
                                lastMessage = last?.optString("content"),
                                updatedAt = obj.optString("updatedAt"),
                            ),
                        )
                    }
                    _state.update { copy(conversations = convs) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    private fun loadMessages(chatId: String) {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.getChatMessages("Bearer $token", chatId)
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body?.optJSONArray("items") ?: body
                    val msgs = mutableListOf<ChatMessage>()
                    for (i in 0 until (items?.length() ?: 0)) {
                        val obj = items?.getJSONObject(i)
                        val sender = obj?.optJSONObject("sender")
                        val myId = session.userId.first() ?: ""
                        msgs.add(
                            ChatMessage(
                                id = obj?.optString("id") ?: continue,
                                text = obj.optString("content"),
                                fromMe = sender?.optString("id") == myId,
                                createdAt = obj.optString("createdAt"),
                                status = obj.optString("status", "SENT"),
                            ),
                        )
                    }
                    _state.update { copy(messages = msgs) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun setTranslationMode(mode: String) {
        _state.update { copy(translationMode = mode) }
    }

    fun setTargetLanguage(lang: String) {
        _state.update { copy(targetLanguage = lang) }
    }

    fun translateMessage(messageId: String, text: String) {
        if (_state.value.translations.containsKey(messageId)) return
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val body = mapOf(
                    "text" to text,
                    "targetLanguage" to _state.value.targetLanguage,
                )
                val response = api.translate("Bearer $token", body)
                if (response.isSuccessful) {
                    val result = response.body()
                    val translated = result?.get("translatedText") as? String
                    if (!translated.isNullOrBlank()) {
                        _state.update { copy(translations = translations + (messageId to translated)) }
                    }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketManager.disconnect()
    }

    private fun MutableStateFlow<ChatUiState>.update(block: ChatUiState.() -> ChatUiState) {
        value = value.block()
    }
}
