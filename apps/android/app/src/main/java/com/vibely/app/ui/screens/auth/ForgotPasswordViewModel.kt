package com.vibely.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.model.ForgotPasswordRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ForgotPasswordUiState(
    val email: String = "",
    val loading: Boolean = false,
    val sent: Boolean = false,
    val error: String? = null,
)

class ForgotPasswordViewModel(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(ForgotPasswordUiState())
    val state: StateFlow<ForgotPasswordUiState> = _state

    fun onEmailChange(v: String) = _state.update { copy(email = v) }

    fun submit() {
        val email = _state.value.email
        _state.update { copy(loading = true, error = null) }
        viewModelScope.launch {
            runCatching { api.forgotPassword(ForgotPasswordRequest(email)) }
                .onSuccess { _state.update { copy(loading = false, sent = true) } }
                .onFailure { _state.update { copy(loading = false, error = it.message ?: "Request failed") } }
        }
    }
}
