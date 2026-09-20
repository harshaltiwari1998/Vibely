package com.vibely.app.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.NotificationsViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun NotificationsScreen(viewModel: NotificationsViewModel) {
    val state by viewModel.notifications.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Text(
            text = "Notifications",
            fontWeight = FontWeight.Bold,
            fontSize = 22.sp,
            modifier = Modifier.padding(16.dp),
            color = Color(0xFF111827)
        )
        when (state) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Loading...", color = Color(0xFF6B7280))
                }
            }
            is UiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text((state as UiState.Error).message, color = Color(0xFFEF4444))
                        Text("Retry", color = Color(0xFF7C3AED), modifier = Modifier.clickable { viewModel.refresh() })
                    }
                }
            }
            is UiState.Success -> {
                val notifications = (state as UiState.Success).data
                if (notifications.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("You're all caught up", color = Color(0xFF6B7280))
                    }
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(notifications) { notification ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (notification.read) Color.Transparent else Color(0xFFF3EEFF))
                                    .clickable { viewModel.markRead(notification.id) }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFFEDE9FE)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Filled.Notifications, contentDescription = null, tint = Color(0xFF7C3AED))
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = notification.title, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                                    Text(text = notification.body, fontSize = 12.sp, color = Color(0xFF6B7280), maxLines = 1)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
