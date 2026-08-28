package com.vibely.app.ui.screens.wallet

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject

data class Transaction(
    val id: String,
    val type: String,
    val amount: Int,
    val balanceAfter: Int,
    val createdAt: String,
    val reference: String?,
)

data class WalletUiState(
    val balance: Int = 0,
    val transactions: List<Transaction> = emptyList(),
    val packages: List<Map<String, Any>> = emptyList(),
    val error: String? = null,
)

class WalletViewModel(
    private val context: Context,
    private val session: SessionPreferences,
    private val api: ApiService,
) : ViewModel() {
    private val _state = MutableStateFlow(WalletUiState())
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    fun loadBalance() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.wallet("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    _state.update { copy(balance = body?.optInt("balance") ?: 0) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun loadTransactions() {
        viewModelScope.launch {
            try {
                val token = session.accessToken.first() ?: return@launch
                val response = api.walletTransactions("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body?.optJSONArray("items") ?: body
                    val txs = mutableListOf<Transaction>()
                    for (i in 0 until (items?.length() ?: 0)) {
                        val obj = items?.getJSONObject(i)
                        txs.add(
                            Transaction(
                                id = obj?.optString("id") ?: continue,
                                type = obj.optString("type"),
                                amount = obj.optInt("amount"),
                                balanceAfter = obj.optInt("balanceAfter"),
                                createdAt = obj.optString("createdAt"),
                                reference = obj.optString("reference"),
                            ),
                        )
                    }
                    _state.update { copy(transactions = txs) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun loadPackages() {
        viewModelScope.launch {
            try {
                val response = api.packages()
                if (response.isSuccessful) {
                    val body = response.body()
                    val items = body ?: emptyList<Map<String, Any>>()
                    _state.update { copy(packages = items) }
                }
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    private fun MutableStateFlow<WalletUiState>.update(block: WalletUiState.() -> WalletUiState) {
        value = value.block()
    }
}
