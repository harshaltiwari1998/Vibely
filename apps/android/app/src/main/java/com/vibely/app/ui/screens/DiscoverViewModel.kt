package com.vibely.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.repository.AuthRepository
import com.vibely.app.data.remote.model.PublicProfileDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DiscoverViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _items = MutableStateFlow<List<PublicProfileDto>>(emptyList())
    val items: StateFlow<List<PublicProfileDto>> = _items.asStateFlow()

    fun load() {
        viewModelScope.launch {
            val token = repo.getAccessToken()
            if (!token.isNullOrBlank()) {
                val result = repo.discover(token)
                if (result.isSuccess) {
                    _items.value = result.getOrNull() ?: emptyList()
                }
            }
        }
    }

    fun toggleFavorite(userId: String) {
        viewModelScope.launch {
            val token = repo.getAccessToken()
            if (!token.isNullOrBlank()) {
                repo.favorite(token, userId)
                _items.update { list -> list.map { if (it.id == userId) it.copy(isFavorite = !it.isFavorite) else it } }
            }
        }
    }
}
