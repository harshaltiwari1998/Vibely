package com.vibely.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class SettingsUiState(
    val language: String = "en",
    val gender: String = "",
    val ageMin: String = "18",
    val ageMax: String = "99",
    val countries: String = "",
    val languages: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
)

class SettingsViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state

    init {
        viewModelScope.launch {
            _state.update { copy(language = repo.session.language.first()) }
            val token = repo.getAccessToken()
            if (!token.isNullOrBlank()) {
                val result = repo.me(token)
                if (result.isSuccess) {
                    val user = result.getOrNull()
                    _state.update {
                        copy(
                            language = user?.language ?: language,
                            gender = user?.gender ?: "",
                        )
                    }
                }
            }
        }
    }

    fun onLanguageChange(v: String) = _state.update { copy(language = v) }
    fun onGenderChange(v: String) = _state.update { copy(gender = v) }
    fun onAgeMinChange(v: String) = _state.update { copy(ageMin = v) }
    fun onAgeMaxChange(v: String) = _state.update { copy(ageMax = v) }
    fun onCountriesChange(v: String) = _state.update { copy(countries = v) }
    fun onLanguagesChange(v: String) = _state.update { copy(languages = v) }

    fun save() {
        val s = _state.value
        _state.update { copy(loading = true, error = null, success = false) }
        viewModelScope.launch {
            val token = repo.getAccessToken()
            if (token.isNullOrBlank()) {
                _state.update { copy(loading = false, error = "Not authenticated") }
                return@launch
            }
            val prefs = com.vibely.app.data.remote.model.UpdatePreferencesRequest(
                preferredGender = s.gender.ifBlank { null },
                preferredAgeMin = s.ageMin.toIntOrNull(),
                preferredAgeMax = s.ageMax.toIntOrNull(),
                preferredCountries = s.countries.split(",").map { it.trim() }.filter { it.isNotBlank() }.ifEmpty { null },
                preferredLanguages = s.languages.split(",").map { it.trim() }.filter { it.isNotBlank() }.ifEmpty { null },
            )
            val result = repo.updatePreferences(token, prefs)
            _state.update {
                if (result.isSuccess) copy(loading = false, success = true)
                else copy(loading = false, error = result.exceptionOrNull()?.message ?: "Save failed")
            }
        }
    }

    private fun MutableStateFlow<SettingsUiState>.update(block: SettingsUiState.() -> SettingsUiState) {
        value = value.block()
    }
}
