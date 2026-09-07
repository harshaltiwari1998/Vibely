package com.vibely.app.ui.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class RewardTask(val icon: String, val title: String, val reward: String, val action: String)

@Composable
fun TaskCenterScreen() {
    val claimed = remember { mutableStateMapOf<String, Boolean>() }
    val tasks = listOf(
        RewardTask("◌", "Give gifts in a live room", "Card x1", "GO"),
        RewardTask("▣", "Watch a reward video", "Diamond x10", "GO"),
        RewardTask("◌", "Accumulate gifts", "Diamond x1.0K", "Expand"),
        RewardTask("◉", "Accumulate game investment", "Diamond x6.5K", "Expand"),
        RewardTask("□", "Accumulate login", "Card x4", "Expand"),
        RewardTask("▤", "Modify nickname", "Card x1", "Received")
    )
    Column(modifier = Modifier.background(Color(0xFFB719F3))) {
        Column(modifier = Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFF681AE6), Color(0xFFE529DC)))).padding(24.dp)) {
            Text("JHOLAMET REWARDS", color = Color.White.copy(alpha = 0.75f), fontWeight = FontWeight.Bold, fontSize = 12.sp)
            Text("TASK CENTER", color = Color.White, fontWeight = FontWeight.Black, fontSize = 34.sp)
            Text("Complete activities and collect rewards.", color = Color.White.copy(alpha = 0.86f), fontSize = 14.sp)
        }
        LazyColumn(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(tasks) { task ->
                val isClaimed = claimed[task.title] == true || task.action == "Received"
                Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color.White).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFF3EBFF)), contentAlignment = Alignment.Center) { Text(task.icon, color = Color(0xFF9747EF), fontSize = 22.sp) }
                    Spacer(Modifier.width(13.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(task.title, color = Color(0xFF19131F), fontWeight = FontWeight.Bold)
                        Text(task.reward, color = Color(0xFFD31CE5), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                    Text(if (isClaimed) "Received" else task.action, color = if (isClaimed) Color(0xFFAAAAAA) else Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(if (isClaimed) Color(0xFFF0F0F0) else Color(0xFFB54CF0)).clickable(enabled = !isClaimed) { claimed[task.title] = true }.padding(horizontal = 16.dp, vertical = 10.dp))
                }
            }
        }
    }
}
