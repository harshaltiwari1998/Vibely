package com.vibely.app.ui.screens.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.vibely.app.ui.screens.notifications.NotificationItem

@Composable
fun NotificationItem(
    notification: NotificationItem,
    onMarkRead: () -> Unit,
    onDelete: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .background(
                    color = if (notification.read) Color.Gray else Color.Blue,
                    shape = CircleShape,
                ),
        )
        Column(modifier = Modifier.weight(1f).padding(horizontal = 8.dp)) {
            Text(text = notification.title, style = MaterialTheme.typography.bodyMedium)
            Text(text = notification.body, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            Text(text = notification.createdAt, style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
        }
        if (!notification.read) {
            IconButton(onClick = onMarkRead) {
                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = "Mark read")
            }
        }
        IconButton(onClick = onDelete) {
            Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete")
        }
    }
}
