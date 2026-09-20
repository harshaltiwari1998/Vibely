package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.LeaderboardEntryResponse
import com.vibely.app.data.remote.dto.PartyRoomResponse
import com.vibely.app.data.remote.dto.RequestWithdrawalBody
import com.vibely.app.data.remote.dto.StartPartyRequest
import com.vibely.app.data.remote.dto.WithdrawalResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PartyListViewModel(private val api: ApiService) : ViewModel() {
    private val _rooms = MutableStateFlow<UiState<List<PartyRoomResponse>>>(UiState.Loading)
    val rooms: StateFlow<UiState<List<PartyRoomResponse>>> = _rooms.asStateFlow()

    private val _starting = MutableStateFlow(false)
    val starting: StateFlow<Boolean> = _starting.asStateFlow()

    private val _startedRoomId = MutableStateFlow<String?>(null)
    val startedRoomId: StateFlow<String?> = _startedRoomId.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { load() }

    fun retry() = load()

    private fun load() {
        viewModelScope.launch {
            _rooms.value = UiState.Loading
            try {
                val resp = api.listPartyRooms()
                if (resp.success && resp.data != null) {
                    _rooms.value = UiState.Success(resp.data)
                } else {
                    _rooms.value = UiState.Error(resp.message ?: "Failed to load party rooms")
                }
            } catch (e: Exception) {
                _rooms.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun startParty(title: String) {
        if (title.isBlank()) {
            _message.value = "Give your room a title first"
            return
        }
        viewModelScope.launch {
            _starting.value = true
            try {
                val resp = api.startParty(StartPartyRequest(title = title.trim()))
                if (resp.success && resp.data != null) {
                    _startedRoomId.value = resp.data.room.id
                } else {
                    _message.value = resp.message ?: "Failed to start room"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _starting.value = false
            }
        }
    }

    fun consumeStartedRoomId() { _startedRoomId.value = null }
    fun consumeMessage() { _message.value = null }
}

class WithdrawalViewModel(private val api: ApiService) : ViewModel() {
    private val _history = MutableStateFlow<UiState<List<WithdrawalResponse>>>(UiState.Loading)
    val history: StateFlow<UiState<List<WithdrawalResponse>>> = _history.asStateFlow()

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _history.value = UiState.Loading
            try {
                val resp = api.myWithdrawals()
                if (resp.success && resp.data != null) {
                    _history.value = UiState.Success(resp.data.items)
                } else {
                    _history.value = UiState.Error(resp.message ?: "Failed to load withdrawals")
                }
            } catch (e: Exception) {
                _history.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun requestWithdrawal(beansAmount: Int, upiId: String) {
        viewModelScope.launch {
            _isSubmitting.value = true
            try {
                val resp = api.requestWithdrawal(RequestWithdrawalBody(beansAmount, upiId))
                if (resp.success) {
                    _message.value = "Withdrawal request submitted"
                    refresh()
                } else {
                    _message.value = resp.message ?: "Failed to submit request"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun consumeMessage() { _message.value = null }
}

class LeaderboardViewModel(private val api: ApiService) : ViewModel() {
    private val _entries = MutableStateFlow<UiState<List<LeaderboardEntryResponse>>>(UiState.Loading)
    val entries: StateFlow<UiState<List<LeaderboardEntryResponse>>> = _entries.asStateFlow()

    private var type = "senders"
    private var period = "all"

    init { load() }

    fun setFilters(type: String, period: String) {
        this.type = type
        this.period = period
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _entries.value = UiState.Loading
            try {
                val resp = api.getLeaderboard(type, period)
                if (resp.success && resp.data != null) {
                    _entries.value = UiState.Success(resp.data)
                } else {
                    _entries.value = UiState.Error(resp.message ?: "Failed to load leaderboard")
                }
            } catch (e: Exception) {
                _entries.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}
