package com.vibely.app.ui.party

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class PartyRoom(val title: String, val members: Int, val tag: String, val color: Color)

private val partyRooms = listOf(
    PartyRoom("Ms. Joineg Agency", 1, "welcome to my f", Color(0xFF7A1E12)),
    PartyRoom("OLA MAI", 3, "Join Agency", Color(0xFF2B1B08)),
    PartyRoom("Room Level 6", 9, "welcome", Color(0xFFB8319B)),
    PartyRoom("Room Level 8", 4, "let's chat", Color(0xFF2C1E63))
)

@Composable
fun PartyRoomGrid(modifier: Modifier = Modifier) {
    LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = modifier, verticalArrangement = Arrangement.spacedBy(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Column(
                modifier = Modifier.aspectRatio(0.72f).clip(RoundedCornerShape(16.dp)).background(Brush.verticalGradient(listOf(Color(0xFF5B3A0A), Color(0xFF1B1204)))).padding(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Bottom
            ) {
                Button(onClick = { }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD8A94A))) {
                    Text("Join/Create family", color = Color(0xFF3B2506), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
        items(partyRooms) { room ->
            Box(modifier = Modifier.aspectRatio(0.72f).clip(RoundedCornerShape(16.dp)).background(Brush.verticalGradient(listOf(room.color.copy(alpha = 0.5f), room.color)))) {
                Column(modifier = Modifier.align(Alignment.BottomStart).padding(12.dp)) {
                    Text("👥 ${room.members}", color = Color.White, fontSize = 12.sp)
                    Text(room.title, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp, maxLines = 1)
                        Text(room.tag, color = Color.White.copy(alpha = 0.85f), fontSize = 11.sp, maxLines = 1)
                }
            }
        }
    }
}

@Composable
fun PartyScreen() {
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Party  ", color = Color(0xFF3C3A3C), fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Family", color = Color(0xFFFF5B82), fontSize = 26.sp, fontWeight = FontWeight.Black)
        }
        PartyRoomGrid(modifier = Modifier.padding(top = 16.dp))
    }
}
