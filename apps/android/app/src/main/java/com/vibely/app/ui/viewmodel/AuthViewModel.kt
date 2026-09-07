package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.model.User
import com.vibely.app.data.repository.FakeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object OtpSent : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(private val repository: FakeRepository = FakeRepository()) : ViewModel() {
    private val _state = MutableStateFlow<AuthState>(AuthState.Idle)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email.asStateFlow()

    private val _otp = MutableStateFlow("")
    val otp: StateFlow<String> = _otp.asStateFlow()

    fun onEmailChange(value: String) { _email.value = value }
    fun onOtpChange(value: String) { _otp.value = value }

    fun sendOtp() {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            kotlinx.coroutines.delay(1200)
            _otp.value = "1234"
            if (_email.value.contains("@")) {
                _state.value = AuthState.OtpSent
            } else {
                _state.value = AuthState.Error("Enter a valid email")
            }
        }
    }

    fun verifyOtp() {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            kotlinx.coroutines.delay(1200)
            if (_otp.value.length >= 4) {
                _state.value = AuthState.Success
            } else {
                _state.value = AuthState.Error("Invalid OTP")
            }
        }
    }

    fun resetState() { _state.value = AuthState.Idle }
}
