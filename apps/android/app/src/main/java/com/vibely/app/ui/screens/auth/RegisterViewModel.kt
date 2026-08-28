package com.vibely.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.model.RegisterRequest
import com.vibely.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class RegisterUiState(
    val username: String = "",
    val email: String = "",
    val password: String = "",
    val dateOfBirth: String = "",
    val country: String = "",
    val language: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
)

class RegisterViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(RegisterUiState())
    val state: StateFlow<RegisterUiState> = _state

    fun update(block: RegisterUiState.() -> RegisterUiState) {
        _state.value = _state.value.block()
    }

    fun register() {
        val s = _state.value
        _state.update { copy(loading = true, error = null) }
        viewModelScope.launch {
            val result = repo.register(
                RegisterRequest(s.username, s.email, s.password, s.dateOfBirth, "OTHER", s.country, s.language),
            )
            _state.update {
                if (result.isSuccess) copy(loading = false, success = true)
                else copy(loading = false, error = result.exceptionOrNull()?.message ?: "Registration failed")
            }
        }
    }
}
