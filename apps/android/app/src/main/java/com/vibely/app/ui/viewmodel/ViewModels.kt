package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.model.CallLog
import com.vibely.app.data.model.ChatMessage
import com.vibely.app.data.model.User
import com.vibely.app.data.repository.FakeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class HomeViewModel(private val repository: FakeRepository = FakeRepository()) : ViewModel() {
    private val _recommendations = MutableStateFlow<UiState<List<User>>>(UiState.Loading)
    val recommendations: StateFlow<UiState<List<User>>> = _recommendations.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getRecommendations().collect { list ->
                _recommendations.value = UiState.Success(list)
            }
        }
    }
}

class DiscoverViewModel(private val repository: FakeRepository = FakeRepository()) : ViewModel() {
    private val _users = MutableStateFlow<UiState<List<User>>>(UiState.Loading)
    val users: StateFlow<UiState<List<User>>> = _users.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getDiscoverUsers().collect { list ->
                _users.value = UiState.Success(list)
            }
        }
    }
}

class MatchViewModel(private val repository: FakeRepository = FakeRepository()) : ViewModel() {
    private val _matches = MutableStateFlow<UiState<List<User>>>(UiState.Loading)
    val matches: StateFlow<UiState<List<User>>> = _matches.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getMatches().collect { list ->
                _matches.value = UiState.Success(list)
            }
        }
    }
}

class ChatViewModel(private val repository: FakeRepository = FakeRepository()) : ViewModel() {
    private val _messages = MutableStateFlow<UiState<List<ChatMessage>>>(UiState.Loading)
    val messages: StateFlow<UiState<List<ChatMessage>>> = _messages.asStateFlow()

    private val _input = MutableStateFlow("")
    val input: StateFlow<String> = _input.asStateFlow()

    fun onInputChange(value: String) { _input.value = value }

    fun loadMessages(userId: String) {
        viewModelScope.launch {
            _messages.value = UiState.Loading
            repository.getChatMessages(userId).collect { list ->
                _messages.value = UiState.Success(list)
            }
        }
    }

    fun sendMessage(userId: String) {
        viewModelScope.launch {
            val text = _input.value.trim()
            if (text.isNotBlank()) {
                val msg = ChatMessage(
                    id = System.currentTimeMillis().toString(),
                    senderId = "me",
                    receiverId = userId,
                    text = text
                )
                val current = (_messages.value as? UiState.Success)?.data.orEmpty().toMutableList()
                current.add(msg)
                _messages.value = UiState.Success(current)
                _input.value = ""
            }
        }
    }
}

class CallViewModel(private val repository: FakeRepository = FakeRepository()) : ViewModel() {
    private val _history = MutableStateFlow<UiState<List<CallLog>>>(UiState.Loading)
    val history: StateFlow<UiState<List<CallLog>>> = _history.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getCallHistory().collect { list ->
                _history.value = UiState.Success(list)
            }
        }
    }
}
