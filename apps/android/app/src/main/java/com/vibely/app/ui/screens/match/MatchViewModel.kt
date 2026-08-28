package com.vibely.app.ui.screens.match

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject

enum class MatchStatus { IDLE, SEARCHING, MATCHED, CANCELLED, EXPIRED }

data class MatchUiState(
    val status: MatchStatus = MatchStatus.IDLE,
    val matchId: String? = null,
    val peerId: String? = null,
    val peerName: String? = null,
    val error: String? = null,
)

class MatchViewModel(
    private val api: ApiService,
    private val session: SessionPreferences,
    private val socketManager: SocketManager,
) : ViewModel() {
    private val _state = MutableStateFlow(MatchUiState())
    val state: StateFlow<MatchUiState> = _state.asStateFlow()

    private var socketListener: SocketManager.SocketListener? = null

    init {
        viewModelScope.launch {
            val token = session.accessToken.first()
            if (!token.isNullOrBlank()) {
                connectSocket(token)
            }
        }
    }

    private fun connectSocket(token: String) {
        socketListener = object : SocketManager.SocketListener {
            override fun onConnected() {
                Log.d("MatchVM", "socket connected")
            }

            override fun onDisconnected() {
                Log.d("MatchVM", "socket disconnected")
            }

            override fun onError(message: String) {
                _state.update { copy(error = message) }
            }

            override fun onMatchSearching() {
                _state.update { copy(status = MatchStatus.SEARCHING, error = null) }
            }

            override fun onMatchFound(matchId: String, peerId: String) {
                _state.update { copy(status = MatchStatus.MATCHED, matchId = matchId, peerId = peerId, error = null) }
            }

            override fun onMatchCancelled(matchId: String, reason: String?) {
                _state.update { copy(status = MatchStatus.CANCELLED, matchId = matchId, error = reason) }
            }

            override fun onMatchExpired(matchId: String, reason: String?) {
                _state.update { copy(status = MatchStatus.EXPIRED, matchId = matchId, error = reason) }
            }
        }
        socketManager.connect("Bearer $token", socketListener!!)
    }

    fun startSearching() {
        viewModelScope.launch {
            val token = session.accessToken.first() ?: return@launch
            try {
                val body = JSONObject()
                body.put("preferredGender", JSONObject.NULL)
                body.put("preferredAgeMin", 18)
                body.put("preferredAgeMax", 99)
                socketManager.send("match_start", body)
                _state.update { copy(status = MatchStatus.SEARCHING, error = null) }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun cancel() {
        viewModelScope.launch {
            val token = session.accessToken.first() ?: return@launch
            try {
                socketManager.send("match_cancel", JSONObject())
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
            _state.update { copy(status = MatchStatus.IDLE, matchId = null, peerId = null) }
        }
    }

    fun accept() {
        val matchId = _state.value.matchId ?: return
        viewModelScope.launch {
            val token = session.accessToken.first() ?: return@launch
            try {
                val body = JSONObject()
                body.put("matchId", matchId)
                socketManager.send("match_accept", body)
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun decline() {
        val matchId = _state.value.matchId ?: return
        viewModelScope.launch {
            val token = session.accessToken.first() ?: return@launch
            try {
                val body = JSONObject()
                body.put("matchId", matchId)
                socketManager.send("match_decline", body)
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
            _state.update { copy(status = MatchStatus.IDLE, matchId = null, peerId = null, peerName = null) }
        }
    }

    fun skip() {
        val matchId = _state.value.matchId ?: return
        viewModelScope.launch {
            val token = session.accessToken.first() ?: return@launch
            try {
                val body = JSONObject()
                body.put("matchId", matchId)
                socketManager.send("match_decline", body)
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
            _state.update { copy(status = MatchStatus.IDLE, matchId = null, peerId = null, peerName = null) }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketManager.disconnect()
    }

    private fun MutableStateFlow<MatchUiState>.update(block: MatchUiState.() -> MatchUiState) {
        value = value.block()
    }
}
