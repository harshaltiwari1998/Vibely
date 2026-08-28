package com.vibely.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.model.LoginRequest
import com.vibely.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val identifier: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
)

class LoginViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state

    fun onIdentifierChange(v: String) = _state.update { copy(identifier = v) }
    fun onPasswordChange(v: String) = _state.update { copy(password = v) }

    fun login() {
        val (identifier, password) = _state.value
        _state.update { copy(loading = true, error = null) }
        viewModelScope.launch {
            val result = repo.login(identifier, password)
            _state.update {
                if (result.isSuccess) copy(loading = false, success = true)
                else copy(loading = false, error = result.exceptionOrNull()?.message ?: "Login failed")
            }
        }
    }

    private fun MutableStateFlow<LoginUiState>.update(block: LoginUiState.() -> LoginUiState) {
        value = value.block()
    }
}
