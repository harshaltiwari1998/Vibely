package com.vibely.app.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class TokenManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("vibely_auth", Context.MODE_PRIVATE)

    private val _accessToken = MutableStateFlow(prefs.getString("access_token", null))
    val accessToken: StateFlow<String?> = _accessToken

    private val _refreshToken = MutableStateFlow(prefs.getString("refresh_token", null))
    val refreshToken: StateFlow<String?> = _refreshToken

    private val _userId = MutableStateFlow(prefs.getString("user_id", null))
    val userId: StateFlow<String?> = _userId

    private val _username = MutableStateFlow(prefs.getString("username", null))
    val username: StateFlow<String?> = _username

    fun saveTokens(accessToken: String, refreshToken: String, userId: String, username: String) {
        prefs.edit {
            putString("access_token", accessToken)
            putString("refresh_token", refreshToken)
            putString("user_id", userId)
            putString("username", username)
        }
        _accessToken.value = accessToken
        _refreshToken.value = refreshToken
        _userId.value = userId
        _username.value = username
    }

    fun getAccessToken(): String? = prefs.getString("access_token", null)

    fun getUserId(): String? = prefs.getString("user_id", null)

    fun clear() {
        prefs.edit { clear() }
        _accessToken.value = null
        _refreshToken.value = null
        _userId.value = null
        _username.value = null
    }

    fun isLoggedIn(): Boolean = prefs.getString("access_token", null) != null
}
