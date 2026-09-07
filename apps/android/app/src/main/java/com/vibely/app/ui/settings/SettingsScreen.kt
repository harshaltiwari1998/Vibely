package com.vibely.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Text(
            text = "Settings",
            fontWeight = FontWeight.Medium,
            fontSize = 30.sp,
            modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            color = Color(0xFF111827)
        )
        listOf("App Language" to "English", "Account" to "", "Message Notification" to "", "Set password" to "To bind", "Withdrawal password" to "", "Google" to "Connected", "Privacy settings" to "", "Personal blacklist" to "", "Clear cache" to "", "About us" to "V1.1.2.2").forEach { (label, value) ->
            Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 21.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(label, modifier = Modifier.weight(1f), color = Color(0xFF3C3A3C), fontSize = 21.sp)
                Text(value, color = if (value == "Connected") Color(0xFF14C9A0) else Color(0xFFBDBDBD), fontSize = 15.sp)
                Text("›", color = Color(0xFFC8C8C8), fontSize = 32.sp, modifier = Modifier.padding(start = 10.dp))
            }
        }
    }
}
