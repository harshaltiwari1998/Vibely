package com.vibely.app.ui.tasks

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.TaskViewModel
import com.vibely.app.ui.viewmodel.UiState

private val taskIcons = mapOf(
    "DAILY_CHECKIN" to "◌",
    "COMPLETE_PROFILE" to "▤",
    "FIRST_GIFT" to "🎁",
    "GIFT_VETERAN" to "⭐",
    "FIRST_RECHARGE" to "💎",
    "GO_LIVE_ONCE" to "🔴",
)

@Composable
fun TaskCenterScreen(viewModel: TaskViewModel, onWalletChanged: () -> Unit = {}, onBack: () -> Unit = {}) {
    val context = LocalContext.current
    val state by viewModel.tasks.collectAsState()
    val isClaiming by viewModel.isClaiming.collectAsState()
    val message by viewModel.message.collectAsState()

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFB719F3))) {
        Column(modifier = Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFF681AE6), Color(0xFFE529DC)))).padding(horizontal = 24.dp, vertical = 20.dp)) {
            Text("‹", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { onBack() })
            Text("VIBELY REWARDS", color = Color.White.copy(alpha = 0.75f), fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
            Text("TASK CENTER", color = Color.White, fontWeight = FontWeight.Black, fontSize = 34.sp)
            Text("Complete activities and collect rewards.", color = Color.White.copy(alpha = 0.86f), fontSize = 14.sp)
        }
        when (val s = state) {
            is UiState.Loading -> Text("Loading...", color = Color.White, modifier = Modifier.padding(24.dp))
            is UiState.Error -> Text(s.message, color = Color.White, modifier = Modifier.padding(24.dp))
            is UiState.Success -> {
                LazyColumn(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(s.data) { task ->
                        val isClaimable = task.status == "CLAIMABLE"
                        val label = when (task.status) {
                            "CLAIMED" -> "Received"
                            "CLAIMABLE" -> "GO"
                            else -> "Locked"
                        }
                        Row(
                            modifier = Modifier
                                .alpha(if (isClaiming) 0.6f else 1f)
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFF3EBFF)), contentAlignment = Alignment.Center) {
                                Text(taskIcons[task.type] ?: "◌", fontSize = 22.sp)
                            }
                            Spacer(modifier = Modifier.width(13.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(task.title, color = Color(0xFF19131F), fontWeight = FontWeight.Bold)
                                Text(task.description, color = Color(0xFF9A9299), fontSize = 12.sp)
                                Text("💎 ${task.reward}", color = Color(0xFFD31CE5), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Text(
                                label,
                                color = if (isClaimable) Color.White else Color(0xFFAAAAAA),
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(if (isClaimable) Color(0xFFB54CF0) else Color(0xFFF0F0F0))
                                    .clickable(enabled = isClaimable && !isClaiming) {
                                        viewModel.claim(task.type, onWalletChanged)
                                    }
                                    .padding(horizontal = 16.dp, vertical = 10.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
