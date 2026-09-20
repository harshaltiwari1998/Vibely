package com.vibely.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.BadgeResponse
import com.vibely.app.data.remote.dto.CreateFamilyRequest
import com.vibely.app.data.remote.dto.FamilyDetailResponse
import com.vibely.app.data.remote.dto.FamilyLeaderboardEntry
import com.vibely.app.data.remote.dto.FamilySummaryResponse
import com.vibely.app.data.remote.dto.LeaderboardEntry
import com.vibely.app.data.remote.dto.LevelStatusResponse
import com.vibely.app.data.remote.dto.MallEquipRequest
import com.vibely.app.data.remote.dto.MallInventoryItemResponse
import com.vibely.app.data.remote.dto.MallItemResponse
import com.vibely.app.data.remote.dto.MallPurchaseRequest
import com.vibely.app.data.remote.dto.SetFeaturedBadgeRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LevelViewModel(private val api: ApiService) : ViewModel() {
    private val _status = MutableStateFlow<UiState<LevelStatusResponse>>(UiState.Loading)
    val status: StateFlow<UiState<LevelStatusResponse>> = _status.asStateFlow()

    private val _leaderboard = MutableStateFlow<UiState<List<LeaderboardEntry>>>(UiState.Loading)
    val leaderboard: StateFlow<UiState<List<LeaderboardEntry>>> = _leaderboard.asStateFlow()

    init {
        refresh()
        loadLeaderboard()
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                val resp = api.getLevelStatus()
                if (resp.success && resp.data != null) {
                    _status.value = UiState.Success(resp.data)
                } else {
                    _status.value = UiState.Error(resp.message ?: "Failed to load level")
                }
            } catch (e: Exception) {
                _status.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun loadLeaderboard() {
        viewModelScope.launch {
            try {
                val resp = api.getLevelLeaderboard()
                if (resp.success && resp.data != null) {
                    _leaderboard.value = UiState.Success(resp.data)
                } else {
                    _leaderboard.value = UiState.Error(resp.message ?: "Failed to load leaderboard")
                }
            } catch (e: Exception) {
                _leaderboard.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }
}

class BadgesViewModel(private val api: ApiService) : ViewModel() {
    private val _badges = MutableStateFlow<UiState<List<BadgeResponse>>>(UiState.Loading)
    val badges: StateFlow<UiState<List<BadgeResponse>>> = _badges.asStateFlow()

    private val _featuredBadgeId = MutableStateFlow<String?>(null)
    val featuredBadgeId: StateFlow<String?> = _featuredBadgeId.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            try {
                val resp = api.getMyBadges()
                if (resp.success && resp.data != null) {
                    _badges.value = UiState.Success(resp.data.badges)
                    _featuredBadgeId.value = resp.data.featuredBadgeId
                } else {
                    _badges.value = UiState.Error(resp.message ?: "Failed to load badges")
                }
            } catch (e: Exception) {
                _badges.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun setFeatured(badgeId: String) {
        viewModelScope.launch {
            try {
                val resp = api.setFeaturedBadge(SetFeaturedBadgeRequest(badgeId))
                if (resp.success && resp.data != null) {
                    _featuredBadgeId.value = resp.data.featuredBadgeId
                    _message.value = "Featured badge updated"
                } else {
                    _message.value = resp.message ?: "Could not set featured badge"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            }
        }
    }

    fun consumeMessage() {
        _message.value = null
    }
}

class MallViewModel(private val api: ApiService) : ViewModel() {
    private val _items = MutableStateFlow<UiState<List<MallItemResponse>>>(UiState.Loading)
    val items: StateFlow<UiState<List<MallItemResponse>>> = _items.asStateFlow()

    private val _inventory = MutableStateFlow<UiState<List<MallInventoryItemResponse>>>(UiState.Loading)
    val inventory: StateFlow<UiState<List<MallInventoryItemResponse>>> = _inventory.asStateFlow()

    private val _isBusy = MutableStateFlow(false)
    val isBusy: StateFlow<Boolean> = _isBusy.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        loadItems()
        loadInventory()
    }

    fun loadItems() {
        viewModelScope.launch {
            try {
                val resp = api.getMallItems()
                if (resp.success && resp.data != null) {
                    _items.value = UiState.Success(resp.data)
                } else {
                    _items.value = UiState.Error(resp.message ?: "Failed to load items")
                }
            } catch (e: Exception) {
                _items.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun loadInventory() {
        viewModelScope.launch {
            try {
                val resp = api.getMallInventory()
                if (resp.success && resp.data != null) {
                    _inventory.value = UiState.Success(resp.data)
                } else {
                    _inventory.value = UiState.Error(resp.message ?: "Failed to load inventory")
                }
            } catch (e: Exception) {
                _inventory.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun purchase(itemId: String, onWalletChanged: () -> Unit = {}) {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                val resp = api.purchaseMallItem(MallPurchaseRequest(itemId))
                if (resp.success) {
                    _message.value = "Purchased!"
                    loadInventory()
                    onWalletChanged()
                } else {
                    _message.value = resp.message ?: "Purchase failed"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun equip(itemId: String) {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                api.equipMallItem(MallEquipRequest(itemId))
                loadInventory()
            } catch (_: Exception) {
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun unequip(itemId: String) {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                api.unequipMallItem(MallEquipRequest(itemId))
                loadInventory()
            } catch (_: Exception) {
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun consumeMessage() {
        _message.value = null
    }
}

class FamilyViewModel(private val api: ApiService) : ViewModel() {
    private val _myFamily = MutableStateFlow<UiState<FamilyDetailResponse?>>(UiState.Loading)
    val myFamily: StateFlow<UiState<FamilyDetailResponse?>> = _myFamily.asStateFlow()

    private val _browseList = MutableStateFlow<UiState<List<FamilySummaryResponse>>>(UiState.Loading)
    val browseList: StateFlow<UiState<List<FamilySummaryResponse>>> = _browseList.asStateFlow()

    private val _leaderboard = MutableStateFlow<UiState<List<FamilyLeaderboardEntry>>>(UiState.Loading)
    val leaderboard: StateFlow<UiState<List<FamilyLeaderboardEntry>>> = _leaderboard.asStateFlow()

    private val _isBusy = MutableStateFlow(false)
    val isBusy: StateFlow<Boolean> = _isBusy.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        refresh()
        browse()
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                val resp = api.getMyFamily()
                if (resp.success) {
                    _myFamily.value = UiState.Success(resp.data)
                    resp.data?.let { loadLeaderboard(it.id) }
                } else {
                    _myFamily.value = UiState.Error(resp.message ?: "Failed to load family")
                }
            } catch (e: Exception) {
                _myFamily.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun browse(search: String? = null) {
        viewModelScope.launch {
            _browseList.value = UiState.Loading
            try {
                val resp = api.listFamilies(search)
                if (resp.success && resp.data != null) {
                    _browseList.value = UiState.Success(resp.data)
                } else {
                    _browseList.value = UiState.Error(resp.message ?: "Failed to load families")
                }
            } catch (e: Exception) {
                _browseList.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    private fun loadLeaderboard(familyId: String) {
        viewModelScope.launch {
            try {
                val resp = api.getFamilyLeaderboard(familyId)
                if (resp.success && resp.data != null) {
                    _leaderboard.value = UiState.Success(resp.data)
                }
            } catch (_: Exception) {
            }
        }
    }

    fun create(name: String, bio: String?) {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                val resp = api.createFamily(CreateFamilyRequest(name, bio))
                if (resp.success && resp.data != null) {
                    _myFamily.value = UiState.Success(resp.data)
                    loadLeaderboard(resp.data.id)
                    _message.value = "Family created!"
                } else {
                    _message.value = resp.message ?: "Could not create family"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun join(familyId: String) {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                val resp = api.joinFamily(familyId)
                if (resp.success && resp.data != null) {
                    _myFamily.value = UiState.Success(resp.data)
                    loadLeaderboard(resp.data.id)
                    _message.value = "Joined ${resp.data.name}!"
                } else {
                    _message.value = resp.message ?: "Could not join family"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun leave() {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                val resp = api.leaveFamily()
                if (resp.success) {
                    _myFamily.value = UiState.Success(null)
                    _message.value = "Left family"
                } else {
                    _message.value = resp.message ?: "Could not leave family"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun disband() {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            try {
                val resp = api.disbandFamily()
                if (resp.success) {
                    _myFamily.value = UiState.Success(null)
                    _message.value = "Family disbanded"
                } else {
                    _message.value = resp.message ?: "Could not disband family"
                }
            } catch (e: Exception) {
                _message.value = e.message ?: "Network error"
            } finally {
                _isBusy.value = false
            }
        }
    }

    fun consumeMessage() {
        _message.value = null
    }
}
