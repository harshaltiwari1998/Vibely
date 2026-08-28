package com.vibely.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.AppNavHost
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory
import com.vibely.app.ui.screens.notifications.NotificationsViewModel
import com.vibely.app.ui.theme.VibelyTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VibelyTheme {
                AppNavHost()
                handleDeepLink(intent)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setContent {
            VibelyTheme {
                AppNavHost()
                handleDeepLink(intent)
            }
        }
    }

    @Composable
    private fun handleDeepLink(intent: Intent?) {
        val container = rememberContainer()
        val vm: NotificationsViewModel = viewModel(factory = vmFactory { NotificationsViewModel(container.sessionPreferences, container.apiService) })
        val state by vm.state.collectAsState()

        LaunchedEffect(intent) {
            val data = intent?.data
            val notificationId = intent?.getStringExtra("notification_id")
            if (data != null && data.toString().startsWith("vibely://notification")) {
                vm.loadNotifications()
            }
        }
    }
}
