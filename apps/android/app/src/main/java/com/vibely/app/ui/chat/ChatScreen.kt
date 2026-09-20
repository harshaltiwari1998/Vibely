package com.vibely.app.ui.chat

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.ChatViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun ChatScreen(userId: String, myUserId: String?, viewModel: ChatViewModel, onWalletChanged: () -> Unit = {}) {
    val context = LocalContext.current
    LaunchedEffect(userId) {
        viewModel.loadMessages(userId)
        viewModel.loadGifts()
    }
    val state by viewModel.messages.collectAsState()
    val input by viewModel.input.collectAsState()
    val gifts by viewModel.gifts.collectAsState()
    val isSendingGift by viewModel.isSendingGift.collectAsState()
    val giftMessage by viewModel.giftMessage.collectAsState()
    var showGifts by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(giftMessage) {
        giftMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeGiftMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
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
                        Text("Retry", color = Color(0xFF7C3AED), modifier = Modifier.clickable { viewModel.loadMessages(userId) })
                    }
                }
            }
            is UiState.Success -> {
                val messages = (state as UiState.Success).data
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    state = listState,
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(messages) { msg ->
                        val isMe = msg.senderId == myUserId
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                        ) {
                            Column(
                                modifier = Modifier
                                    .widthIn(max = 260.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isMe) Color(0xFF7C3AED) else Color.White)
                                    .padding(12.dp)
                            ) {
                                Text(
                                    text = msg.text,
                                    color = if (isMe) Color.White else Color(0xFF111827),
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = formatTime(msg.timestamp),
                                    color = if (isMe) Color(0xFFE9D5FF) else Color(0xFF9CA3AF),
                                    fontSize = 10.sp,
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
                if (showGifts) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        items(gifts) { gift ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .alpha(if (isSendingGift) 0.6f else 1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFF3F4F6))
                                    .clickable(enabled = !isSendingGift) {
                                        viewModel.sendGift(userId, gift.id, onWalletChanged)
                                        showGifts = false
                                    }
                                    .padding(10.dp)
                            ) {
                                Text(gift.iconUrl, fontSize = 22.sp)
                                Text(gift.name, fontSize = 10.sp, color = Color(0xFF111827))
                                Text("💎 ${gift.coinCost}", fontSize = 10.sp, color = Color(0xFF6B7280))
                            }
                        }
                    }
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { showGifts = !showGifts }) {
                        Icon(imageVector = Icons.Filled.CardGiftcard, contentDescription = "Send gift", tint = Color(0xFFD97706))
                    }
                    OutlinedTextField(
                        value = input,
                        onValueChange = { viewModel.onInputChange(it) },
                        placeholder = { Text("Type a message") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(onClick = { viewModel.sendMessage(userId) }) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color(0xFF7C3AED))
                    }
                }
            }
        }
    }
}

private fun formatTime(ts: Long): String {
    val sdf = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(ts))
}
