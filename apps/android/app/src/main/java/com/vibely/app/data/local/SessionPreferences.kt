package com.vibely.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "vibely_session")

/**
 * Session persistence via DataStore (tokens, current user id, locale). Never
 * caches plaintext passwords; only the refresh token is stored securely here.
 */
class SessionPreferences(private val context: Context) {

    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_ID = stringPreferencesKey("user_id")
        val LANGUAGE = stringPreferencesKey("language")
    }

    val accessToken: Flow<String?> = context.dataStore.data.map { it[Keys.ACCESS_TOKEN] }
    val userId: Flow<String?> = context.dataStore.data.map { it[Keys.USER_ID] }
    val language: Flow<String> = context.dataStore.data.map { it[Keys.LANGUAGE] ?: "en" }

    suspend fun saveSession(accessToken: String, refreshToken: String, userId: String) {
        context.dataStore.edit { prefs ->
            prefs[Keys.ACCESS_TOKEN] = accessToken
            prefs[Keys.REFRESH_TOKEN] = refreshToken
            prefs[Keys.USER_ID] = userId
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
