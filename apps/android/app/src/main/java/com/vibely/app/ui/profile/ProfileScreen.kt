package com.vibely.app.ui.profile

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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class ProfileMenuItem(val label: String, val route: String? = null)

@Composable
fun ProfileScreen(onOpenTasks: () -> Unit = {}, onOpenInvitation: () -> Unit = {}) {
    val menuItems = listOf(
        ProfileMenuItem("Task", "tasks"),
        ProfileMenuItem("My level"),
        ProfileMenuItem("My Badge"),
        ProfileMenuItem("Family"),
        ProfileMenuItem("My invitation", "invitation"),
        ProfileMenuItem("Mall"),
        ProfileMenuItem("My profile"),
        ProfileMenuItem("My chat price")
    )
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(20.dp)) {
        Row(verticalAlignment = Alignment.Top, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Harshal", fontWeight = FontWeight.Black, fontSize = 26.sp, color = Color(0xFF1B1720))
                Text("64475853", color = Color(0xFF9A9299), fontSize = 13.sp)
                Row(modifier = Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("♂ 28", color = Color.White, fontSize = 12.sp, modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(Color(0xFF3FB6E8)).padding(horizontal = 12.dp, vertical = 6.dp))
                    Text("English", color = Color.White, fontSize = 12.sp, modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(Color(0xFFF29B3C)).padding(horizontal = 12.dp, vertical = 6.dp))
                }
            }
            Box(modifier = Modifier.size(84.dp).clip(CircleShape).background(Color(0xFFD9F2D2)))
        }
        Row(modifier = Modifier.fillMaxWidth().padding(top = 20.dp).clip(RoundedCornerShape(16.dp)).background(Color(0xFFF5F4F6)).padding(vertical = 16.dp)) {
            ProfileStat("23", "Friend", Modifier.weight(1f))
            ProfileStat("100", "Follow", Modifier.weight(1f))
            ProfileStat("61", "Fans", Modifier.weight(1f))
        }
        Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ProfileActionCard("My Wallet", "5385", Color(0xFFFF2E7E), Modifier.weight(1f))
            ProfileActionCard("My Income", "6", Color(0xFF3E6BF2), Modifier.weight(1f))
        }
        Box(modifier = Modifier.fillMaxWidth().padding(top = 14.dp).clip(RoundedCornerShape(16.dp)).background(Color(0xFF141215)).padding(18.dp)) {
            Column { Text("Become VIP", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp); Text("VIP center", color = Color(0xFFB7B2BC), fontSize = 13.sp) }
        }
        LazyVerticalGrid(columns = GridCells.Fixed(4), modifier = Modifier.padding(top = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            items(menuItems) { item ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.clickable {
                        when (item.route) {
                            "tasks" -> onOpenTasks()
                            "invitation" -> onOpenInvitation()
                        }
                    }
                ) {
                    Box(modifier = Modifier.size(46.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFFFE3E9)))
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(item.label, fontSize = 11.sp, color = Color(0xFF3C3A3C))
                }
            }
        }
    }
}

@Composable
private fun ProfileStat(value: String, label: String, modifier: Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.Black, fontSize = 24.sp, color = Color(0xFF1B1720))
        Text(label, color = Color(0xFF9A9299), fontSize = 13.sp)
    }
}

@Composable
private fun ProfileActionCard(title: String, value: String, color: Color, modifier: Modifier) {
    Column(modifier = modifier.clip(RoundedCornerShape(16.dp)).background(color).padding(16.dp)) {
        Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        Text(value, color = Color.White, fontWeight = FontWeight.Black, fontSize = 22.sp)
    }
}

