package com.vibely.app.ui.level

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.LevelViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun LevelScreen(viewModel: LevelViewModel, onBack: () -> Unit = {}) {
    var showLeaderboard by remember { mutableStateOf(false) }
    val statusState by viewModel.status.collectAsState()
    val leaderboardState by viewModel.leaderboard.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
            Text("‹", color = Color(0xFF111827), fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 16.dp).clickable { onBack() })
            Text("My level", color = Color(0xFF111827), fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        }
        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.Center) {
            Text("Wealth", color = if (!showLeaderboard) Color(0xFF111827) else Color(0xFF9CA3AF), fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(horizontal = 20.dp).clickable { showLeaderboard = false })
            Text("Leaderboard", color = if (showLeaderboard) Color(0xFF111827) else Color(0xFF9CA3AF), fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(horizontal = 20.dp).clickable { showLeaderboard = true })
        }

        if (!showLeaderboard) {
            Column(modifier = Modifier.padding(20.dp)) {
                when (val s = statusState) {
                    is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280))
                    is UiState.Error -> Text(s.message, color = Color(0xFFEF4444))
                    is UiState.Success -> {
                        val status = s.data
                        Column(
                            modifier = Modifier.fillMaxWidth()
                                .clip(RoundedCornerShape(20.dp))
                                .background(Brush.horizontalGradient(listOf(Color(0xFF7C3AED), Color(0xFFA855F7))))
                                .padding(20.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Upgrade level still need to", color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
                                    Text("${status.xpToNextLevel - status.currentLevelXp} XP", color = Color.White, fontWeight = FontWeight.Black, fontSize = 26.sp, modifier = Modifier.padding(top = 6.dp))
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(modifier = Modifier.size(64.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.2f)))
                                    Text("LV${status.level}", color = Color(0xFF7C3AED), fontWeight = FontWeight.Black, fontSize = 13.sp, modifier = Modifier.padding(top = 6.dp).clip(RoundedCornerShape(10.dp)).background(Color.White).padding(horizontal = 10.dp, vertical = 4.dp))
                                }
                            }
                            Column(modifier = Modifier.padding(top = 18.dp)) {
                                val progress = if (status.xpToNextLevel > 0) status.currentLevelXp.toFloat() / status.xpToNextLevel.toFloat() else 1f
                                LinearProgressIndicator(
                                    progress = { progress.coerceIn(0f, 1f) },
                                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                                    color = Color(0xFFFFD166),
                                    trackColor = Color.White.copy(alpha = 0.25f)
                                )
                                Row(modifier = Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Lv${status.level}", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                                    Text("Lv${status.level + 1}", color = Color(0xFFFFD166), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Text("Level privilege", color = Color(0xFF111827), fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.padding(top = 28.dp))
                        Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                            LevelPrivilege("🏆", "Level icons", "Lv 1")
                            LevelPrivilege("👑", "Global leaderboard", "Lv 1")
                            LevelPrivilege("✨", "Entry effects", "Lv 10")
                        }

                        Text("Level description", color = Color(0xFF111827), fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.padding(top = 28.dp))
                        Text(
                            "Send or receive a gift, complete a task, finish a call, or invite a friend to earn XP. As your level increases, new privileges unlock.",
                            color = Color(0xFF9CA3AF),
                            fontSize = 13.sp,
                            lineHeight = 20.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }
        } else {
            when (val s = leaderboardState) {
                is UiState.Loading -> Text("Loading...", color = Color(0xFF9A9299), modifier = Modifier.padding(20.dp))
                is UiState.Error -> Text(s.message, color = Color(0xFFE64545), modifier = Modifier.padding(20.dp))
                is UiState.Success -> {
                    LazyColumn(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        itemsIndexed(s.data) { index, entry ->
                            LeaderboardRow(rank = index + 1, username = entry.username, level = entry.level, xp = entry.xp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LevelPrivilege(icon: String, label: String, requirement: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(modifier = Modifier.size(56.dp).clip(CircleShape).background(Color(0xFFF3EBFF)), contentAlignment = Alignment.Center) {
            Text(icon, fontSize = 24.sp)
        }
        Text(label, color = Color(0xFF111827), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp), textAlign = TextAlign.Center)
        Text(requirement, color = Color(0xFF9CA3AF), fontSize = 11.sp)
    }
}

@Composable
private fun LeaderboardRow(rank: Int, username: String, level: Int, xp: Int) {
    Row(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0xFFF7F5FA)).padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("#$rank", color = Color(0xFF9A9299), fontWeight = FontWeight.Bold, modifier = Modifier.padding(end = 12.dp))
        Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFFE0E7FF)), contentAlignment = Alignment.Center) {
            Text(username.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF3E6BF2))
        }
        Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
            Text(username, fontWeight = FontWeight.Bold, color = Color(0xFF19131F))
            Text("$xp XP", color = Color(0xFF9A9299), fontSize = 12.sp)
        }
        Text("Lv $level", color = Color(0xFF7C3AED), fontWeight = FontWeight.Bold, modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(Color(0xFFF3EBFF)).padding(horizontal = 12.dp, vertical = 6.dp))
    }
}
