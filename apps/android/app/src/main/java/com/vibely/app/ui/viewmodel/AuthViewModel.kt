package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.LoginRequest
import com.vibely.app.data.remote.dto.RegisterRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(
    private val api: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {
    private val _state = MutableStateFlow<AuthState>(AuthState.Idle)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email.asStateFlow()

    fun onEmailChange(value: String) { _email.value = value }

    fun logout() {
        tokenManager.clear()
        _state.value = AuthState.Idle
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            try {
                val response = api.login(LoginRequest(identifier = email, password = password))
                if (response.success && response.data != null) {
                    val data = response.data
                    tokenManager.saveTokens(
                        accessToken = data.accessToken,
                        refreshToken = data.refreshToken,
                        userId = data.user.id,
                        username = data.user.username
                    )
                    _state.value = AuthState.Success
                } else {
                    _state.value = AuthState.Error(response.message ?: "Login failed")
                }
            } catch (e: Exception) {
                _state.value = AuthState.Error(e.message ?: "Network error")
            }
        }
    }

    fun register(
        username: String,
        email: String,
        password: String,
        dateOfBirth: String,
        gender: String,
        country: String,
        language: String,
        referralCode: String? = null
    ) {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            try {
                val response = api.register(
                    RegisterRequest(
                        username = username,
                        email = email,
                        password = password,
                        dateOfBirth = dateOfBirth,
                        gender = gender,
                        country = country,
                        language = language,
                        referralCode = referralCode?.trim()?.takeIf { it.isNotBlank() }
                    )
                )
                if (response.success && response.data != null) {
                    val data = response.data
                    tokenManager.saveTokens(
                        accessToken = data.accessToken,
                        refreshToken = data.refreshToken,
                        userId = data.user.id,
                        username = data.user.username
                    )
                    _state.value = AuthState.Success
                } else {
                    _state.value = AuthState.Error(response.message ?: "Registration failed")
                }
            } catch (e: Exception) {
                _state.value = AuthState.Error(e.message ?: "Network error")
            }
        }
    }

    fun resetState() { _state.value = AuthState.Idle }
}
