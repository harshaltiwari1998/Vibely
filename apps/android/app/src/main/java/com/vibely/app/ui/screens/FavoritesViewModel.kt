package com.vibely.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.repository.AuthRepository
import com.vibely.app.data.remote.model.FavoriteResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class FavoritesViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _items = MutableStateFlow<List<FavoriteResponse>>(emptyList())
    val items: StateFlow<List<FavoriteResponse>> = _items.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            val token = repo.getAccessToken()
            if (!token.isNullOrBlank()) {
                val result = repo.fetchFavorites(token)
                if (result.isSuccess) {
                    _items.value = result.getOrNull() ?: emptyList()
                }
            }
        }
    }

    fun unfavorite(userId: String) {
        viewModelScope.launch {
            val token = repo.getAccessToken()
            if (!token.isNullOrBlank()) {
                repo.unfavorite(token, userId)
                _items.update { list -> list.filter { it.targetUserId != userId } }
            }
        }
    }
}
