package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.SearchUserResponse
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SearchFilters(
    val gender: String? = null,
    val onlineOnly: Boolean = false,
)

class SearchViewModel(private val api: ApiService) : ViewModel() {
    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private val _filters = MutableStateFlow(SearchFilters())
    val filters: StateFlow<SearchFilters> = _filters.asStateFlow()

    private val _results = MutableStateFlow<UiState<List<SearchUserResponse>>>(UiState.Success(emptyList()))
    val results: StateFlow<UiState<List<SearchUserResponse>>> = _results.asStateFlow()

    private var searchJob: Job? = null

    fun setQuery(value: String) {
        _query.value = value
        scheduleSearch()
    }

    fun setFilters(value: SearchFilters) {
        _filters.value = value
        scheduleSearch(immediate = true)
    }

    private fun scheduleSearch(immediate: Boolean = false) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            if (!immediate) delay(350)
            _results.value = UiState.Loading
            try {
                val f = _filters.value
                val resp = api.searchUsers(
                    q = _query.value.trim().ifBlank { null },
                    gender = f.gender,
                    onlineOnly = if (f.onlineOnly) true else null,
                )
                if (resp.success && resp.data != null) {
                    _results.value = UiState.Success(resp.data.items)
                } else {
                    _results.value = UiState.Error(resp.message ?: "Search failed")
                }
            } catch (e: Exception) {
                _results.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}
