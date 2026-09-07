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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class Conversation(val name: String, val preview: String, val time: String, val color: Color, val system: Boolean = false)

@Composable
fun MessageListScreen(onOpenChat: (String) -> Unit) {
    val conversations = listOf(
        Conversation("Activity", "A new event is now available.", "", Color(0xFF9C3CE8), system = true),
        Conversation("Assistant", "Multi Show is open!", "09:42", Color(0xFFE8207E), system = true),
        Conversation("Event Notifications", "Every Site = New Adventure", "11:33", Color(0xFFF07A2E), system = true),
        Conversation("Rangila", "[Video call]", "07:53", Color(0xFFCC5FA0)),
        Conversation("Ritika gill", "[Video call]", "07:53", Color(0xFF4C8CD8)),
        Conversation("Moniya", "[Video call]", "07:53", Color(0xFFD65C5C)),
        Conversation("Aira", "[Video call]", "07:52", Color(0xFF7B4CC9)),
        Conversation("Aroti mmf", "[Video call]", "07:52", Color(0xFFB8752E)),
        Conversation("Yugi", "[Video call]", "07:52", Color(0xFFE86FA0))
    )
    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Text("Message", color = Color(0xFFFF5B82), fontSize = 32.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(20.dp))
        LazyColumn {
            items(conversations) { conversation ->
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { onOpenChat(conversation.name) }.padding(horizontal = 20.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(52.dp).clip(CircleShape).background(conversation.color), contentAlignment = Alignment.Center) {
                        Text(conversation.name.first().toString(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(conversation.name, fontWeight = FontWeight.Bold, color = Color(0xFF1B1720))
                        Text(conversation.preview, color = Color(0xFF9A9299), fontSize = 13.sp, maxLines = 1)
                    }
                    if (conversation.time.isNotEmpty()) {
                        Text(conversation.time, color = Color(0xFFB5AEB5), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
