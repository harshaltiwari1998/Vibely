package com.vibely.app

import android.app.Application
import com.vibely.app.di.AppContainer

class VibelyApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
