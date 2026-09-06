package com.vibely.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SettingsScreen() {
    val options = listOf(
        "Account" to Icons.Filled.Shield,
        "Privacy" to Icons.Filled.Security,
        "Security" to Icons.Filled.Security,
        "Language" to Icons.Filled.Translate,
        "Help" to Icons.AutoMirrored.Filled.HelpOutline,
        "About" to Icons.AutoMirrored.Filled.HelpOutline
    )
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Text(
            text = "Settings",
            fontWeight = FontWeight.Bold,
            fontSize = 22.sp,
            modifier = Modifier.padding(16.dp),
            color = Color(0xFF111827)
        )
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(options) { (label, icon) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFFEDE9FE)), contentAlignment = Alignment.Center) {
                        Icon(imageVector = icon, contentDescription = null, tint = Color(0xFF7C3AED))
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Text(text = label, modifier = Modifier.weight(1f), color = Color(0xFF111827), fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}
