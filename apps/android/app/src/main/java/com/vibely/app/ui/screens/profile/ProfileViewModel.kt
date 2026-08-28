package com.vibely.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.model.ProfileDto
import com.vibely.app.data.remote.model.UserDto
import com.vibely.app.data.repository.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class ProfileUiState(
    val userId: String? = null,
    val username: String = "",
    val email: String = "",
    val bio: String = "",
    val interests: List<String> = emptyList(),
    val country: String = "",
    val language: String = "",
    val gender: String = "",
    val avatarUrl: String? = null,
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
)

class ProfileViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state

    init {
        viewModelScope.launch {
            val token = repo.getAccessToken()
            if (!token.isNullOrBlank()) {
                loadProfile(token)
            }
        }
    }

    private suspend fun AuthRepository.getAccessToken(): String? =
        withContext(Dispatchers.IO) {
            session.accessToken.first()
        }

    fun loadProfile(token: String) {
        _state.update { copy(loading = true, error = null) }
        viewModelScope.launch {
            val result = repo.me(token)
            _state.update {
                if (result.isSuccess) {
                    val u = result.getOrNull()
                    copy(
                        loading = false,
                        userId = u?.id,
                        username = u?.username ?: "",
                        email = u?.email ?: "",
                        country = u?.country ?: "",
                        language = u?.language ?: "",
                        gender = u?.gender ?: "",
                        avatarUrl = u?.avatarUrl,
                        bio = u?.profile?.bio ?: "",
                        interests = u?.profile?.interests ?: emptyList(),
                    )
                } else {
                    copy(loading = false, error = result.exceptionOrNull()?.message ?: "Failed")
                }
            }
        }
    }

    fun saveProfile(token: String, bio: String, interests: List<String>) {
        _state.update { copy(loading = true, error = null, success = false) }
        viewModelScope.launch {
            val result = repo.updateProfile(token, bio, interests)
            _state.update {
                if (result.isSuccess) copy(loading = false, success = true, bio = bio, interests = interests)
                else copy(loading = false, error = result.exceptionOrNull()?.message ?: "Save failed")
            }
        }
    }

    fun saveUserFields(token: String, country: String, language: String, gender: String, avatarUrl: String?) {
        _state.update { copy(loading = true, error = null, success = false) }
        viewModelScope.launch {
            val result = repo.updateMe(token, country, language, gender, avatarUrl)
            _state.update {
                if (result.isSuccess) {
                    val u = result.getOrNull()
                    copy(loading = false, success = true, country = u?.country ?: country, language = u?.language ?: language, gender = u?.gender ?: gender, avatarUrl = u?.avatarUrl ?: avatarUrl)
                } else {
                    copy(loading = false, error = result.exceptionOrNull()?.message ?: "Save failed")
                }
            }
        }
    }

    fun onBioChange(v: String) = _state.update { copy(bio = v) }
    fun onCountryChange(v: String) = _state.update { copy(country = v) }
    fun onLanguageChange(v: String) = _state.update { copy(language = v) }
    fun onGenderChange(v: String) = _state.update { copy(gender = v) }

    private fun MutableStateFlow<ProfileUiState>.update(block: ProfileUiState.() -> ProfileUiState) {
        value = value.block()
    }
}
