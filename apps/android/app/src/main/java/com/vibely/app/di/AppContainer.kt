package com.vibely.app.di

import android.content.Context
import com.vibely.app.data.local.AppDatabase
import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.CallSocketManager
import com.vibely.app.data.remote.SocketManager
import com.vibely.app.data.repository.AuthRepository

class AppContainer(context: Context) {
    val apiService: ApiService = ApiClient.create()
    val database: AppDatabase = AppDatabase.build(context.applicationContext)
    val sessionPreferences: SessionPreferences = SessionPreferences(context.applicationContext)
    val authRepository: AuthRepository = AuthRepository(apiService, sessionPreferences)
    val socketManager: SocketManager = SocketManager(ApiClient.BASE_URL)
    val callSocketManager: CallSocketManager = CallSocketManager(ApiClient.BASE_URL)
}
