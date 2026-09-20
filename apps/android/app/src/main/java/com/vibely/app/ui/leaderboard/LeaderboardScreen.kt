package com.vibely.app.ui.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.data.remote.dto.LeaderboardEntryResponse
import com.vibely.app.ui.viewmodel.LeaderboardViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun LeaderboardScreen(viewModel: LeaderboardViewModel, onBack: () -> Unit = {}) {
    val entries by viewModel.entries.collectAsState()
    var type by remember { mutableStateOf("senders") }
    var period by remember { mutableStateOf("all") }

    LaunchedEffect(type, period) { viewModel.setFilters(type, period) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
            Text("‹", color = Color(0xFF111827), fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 16.dp).clickable { onBack() })
            Text("Leaderboard", color = Color(0xFF111827), fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        }

        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Chip("Spenders", type == "senders") { type = "senders" }
            Chip("Charmers", type == "receivers") { type = "receivers" }
        }
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Chip("Today", period == "daily") { period = "daily" }
            Chip("This week", period == "weekly") { period = "weekly" }
            Chip("All time", period == "all") { period = "all" }
        }

        when (val s = entries) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280), modifier = Modifier.padding(20.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(20.dp))
            is UiState.Success -> {
                if (s.data.isEmpty()) {
                    Text("No activity in this period yet.", color = Color(0xFF9CA3AF), modifier = Modifier.padding(20.dp))
                } else {
                    LazyColumn(modifier = Modifier.padding(horizontal = 20.dp)) {
                        items(s.data) { entry -> LeaderboardRow(entry, unit = if (type == "senders") "coins spent" else "coins earned") }
                    }
                }
            }
        }
    }
}

@Composable
private fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        color = if (selected) Color.White else Color(0xFF888188),
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(24.dp))
            .background(if (selected) Color(0xFFBD32E8) else Color(0xFFF0EFF0))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 8.dp)
    )
}

@Composable
private fun LeaderboardRow(entry: LeaderboardEntryResponse, unit: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(
            "#${entry.rank}",
            color = when (entry.rank) { 1 -> Color(0xFFF5A623); 2 -> Color(0xFF9CA3AF); 3 -> Color(0xFFB87333); else -> Color(0xFF6B7280) },
            fontWeight = FontWeight.Black,
            fontSize = 16.sp,
            modifier = Modifier.size(36.dp)
        )
        Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFFEFE3FB)))
        Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
            Text(entry.username, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
            Text(unit, fontSize = 11.sp, color = Color(0xFF9CA3AF))
        }
        Text("💰 ${entry.amount}", fontWeight = FontWeight.Bold, color = Color(0xFF7C3AED))
    }
}
