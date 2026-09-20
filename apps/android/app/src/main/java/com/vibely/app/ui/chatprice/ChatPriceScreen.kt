package com.vibely.app.ui.chatprice

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.ChatPriceViewModel
import com.vibely.app.ui.viewmodel.UiState

private fun maxPriceForLevel(level: Int): Int {
    return if (level <= 3) 1260 else 1260 + (level - 3) * 600
}

@Composable
fun ChatPriceScreen(viewModel: ChatPriceViewModel, onBack: () -> Unit = {}) {
    val context = LocalContext.current
    val state by viewModel.status.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val message by viewModel.message.collectAsState()
    var showEditor by remember { mutableStateOf(false) }

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
            Text("‹", color = Color(0xFF111827), fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 16.dp).clickable { onBack() })
            Text("My chat price", color = Color(0xFF111827), fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        }

        when (val s = state) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280), modifier = Modifier.padding(24.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(24.dp))
            is UiState.Success -> {
                val status = s.data
                Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🫘", fontSize = 48.sp)

                    Column(
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFFFF7E5))
                            .clickable { showEditor = true }
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Video call price", color = Color(0xFF9A7B1E), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("${status.pricePerMinute} 🫘 /min ▾", color = Color(0xFF7A5B00), fontWeight = FontWeight.Black, fontSize = 30.sp, modifier = Modifier.padding(top = 6.dp))
                        Text("Earns beans every second", color = Color(0xFFAD8B2E), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                        Text("Appropriate prices make it easier to get calls~", color = Color(0xFFAD8B2E), fontSize = 12.sp)
                    }

                    Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatCard("Level", "Lv ${status.level}", Modifier.weight(1f))
                        StatCard("My beans", "🫘 ${status.beans}", Modifier.weight(1f))
                    }

                    Text("The highest call price", color = Color(0xFF111827), fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.fillMaxWidth().padding(top = 28.dp))
                    Column(modifier = Modifier.fillMaxWidth().padding(top = 12.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFFFFF8DD))) {
                        listOf(3, 4, 5, 6, 7, 8).forEach { level ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(if (level == 3) "≤Lv3" else "Lv$level", color = Color(0xFF7A5B00))
                                Text("${maxPriceForLevel(level)} 🫘 / min", color = Color(0xFF7A5B00), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                if (showEditor) {
                    var draftPrice by remember(status.pricePerMinute) { mutableStateOf(status.pricePerMinute.toFloat()) }
                    AlertDialog(
                        onDismissRequest = { showEditor = false },
                        title = { Text("Set your video call price") },
                        text = {
                            Column {
                                Text("${draftPrice.toInt()} 🫘 / min", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                                Slider(
                                    value = draftPrice,
                                    onValueChange = { draftPrice = it },
                                    valueRange = 0f..status.maxPricePerMinute.toFloat(),
                                    steps = (status.maxPricePerMinute / 60).coerceAtLeast(1) - 1
                                )
                                Text("Max for your level: ${status.maxPricePerMinute} 🫘", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                            }
                        },
                        confirmButton = {
                            TextButton(enabled = !isSaving, onClick = {
                                viewModel.setPrice(draftPrice.toInt())
                                showEditor = false
                            }) { Text("Save") }
                        },
                        dismissButton = {
                            TextButton(onClick = { showEditor = false }) { Text("Cancel") }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier) {
    Column(
        modifier = modifier.clip(RoundedCornerShape(14.dp)).background(Color(0xFFF7F5FA)).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(label, color = Color(0xFF9A9299), fontSize = 12.sp)
        Text(value, color = Color(0xFF19131F), fontWeight = FontWeight.Black, fontSize = 18.sp, modifier = Modifier.padding(top = 4.dp))
    }
}
