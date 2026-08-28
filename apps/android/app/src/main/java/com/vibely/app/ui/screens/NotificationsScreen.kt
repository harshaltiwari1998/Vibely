package com.vibely.app.ui.screens

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.vmFactory
import com.vibely.app.ui.screens.notifications.NotificationsViewModel

@Composable
fun NotificationsScreen() {
    val vm: NotificationsViewModel = viewModel(factory = vmFactory { NotificationsViewModel() })
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) {
        vm.loadNotifications()
    }

    Screen(title = "Notifications") {
        if (state.notifications.isEmpty()) {
            Text("No notifications yet.", modifier = Modifier.fillMaxSize(), style = MaterialTheme.typography.bodyLarge)
            return@Screen
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(state.notifications) { notification ->
                NotificationItem(
                    notification = notification,
                    onMarkRead = { vm.markRead(notification.id) },
                    onDelete = { vm.delete(notification.id) },
                )
            }
        }
    }
}
