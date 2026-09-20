package com.vibely.app.ui.messages

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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.MessagesViewModel
import com.vibely.app.ui.viewmodel.UiState

private val avatarColors = listOf(
    Color(0xFF9C3CE8), Color(0xFFE8207E), Color(0xFFF07A2E),
    Color(0xFFCC5FA0), Color(0xFF4C8CD8), Color(0xFFD65C5C),
    Color(0xFF7B4CC9), Color(0xFFB8752E), Color(0xFFE86FA0)
)

@Composable
fun MessageListScreen(viewModel: MessagesViewModel, onOpenChat: (String) -> Unit) {
    val state by viewModel.chats.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Text("Message", color = Color(0xFFFF5B82), fontSize = 32.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(20.dp))
        when (state) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Loading...", color = Color(0xFF9A9299))
                }
            }
            is UiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text((state as UiState.Error).message, color = Color(0xFFEF4444))
                        Text("Retry", color = Color(0xFF7C3AED), modifier = Modifier.clickable { viewModel.refresh() })
                    }
                }
            }
            is UiState.Success -> {
                val chats = (state as UiState.Success).data
                if (chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No conversations yet", color = Color(0xFF9A9299))
                    }
                } else {
                    LazyColumn {
                        items(chats) { chat ->
                            val color = avatarColors[chat.peer.id.hashCode().mod(avatarColors.size)]
                            Row(
                                modifier = Modifier.fillMaxWidth().clickable { onOpenChat(chat.peer.id) }.padding(horizontal = 20.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(modifier = Modifier.size(52.dp).clip(CircleShape).background(color), contentAlignment = Alignment.Center) {
                                    Text(chat.peer.username.first().uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                }
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(chat.peer.username, fontWeight = FontWeight.Bold, color = Color(0xFF1B1720))
                                    Text(chat.lastMessage?.content ?: "Say hi 👋", color = Color(0xFF9A9299), fontSize = 13.sp, maxLines = 1)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
