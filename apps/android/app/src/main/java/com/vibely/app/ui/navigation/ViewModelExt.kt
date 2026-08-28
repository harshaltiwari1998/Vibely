package com.vibely.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.vibely.app.VibelyApplication
import com.vibely.app.di.AppContainer

/** Resolve the app-wide DI container from any composable. */
@Composable
fun rememberContainer(): AppContainer {
    val app = LocalContext.current.applicationContext as VibelyApplication
    return app.container
}

/** Minimal ViewModel factory used until Hilt is introduced in a later part. */
inline fun <T : ViewModel> vmFactory(crossinline create: () -> T): ViewModelProvider.Factory =
    object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = create() as T
    }
