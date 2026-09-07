package com.vibely.app.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.party.PartyRoomGrid
import com.vibely.app.ui.viewmodel.DiscoverViewModel

@Composable
fun DiscoverScreen(viewModel: DiscoverViewModel) {
    var showParty by remember { mutableStateOf(false) }
    val rooms = listOf("Multi Show" to Color(0xFF143A91), "Ocean Party" to Color(0xFF169996), "Weekend Vibes" to Color(0xFFAF297B), "Music Lounge" to Color(0xFF7C3CAE), "Game Night" to Color(0xFFF38C32), "New Friends" to Color(0xFF4673B8))
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                Text("Live", color = if (!showParty) Color(0xFFFF5B82) else Color(0xFFC9C3C9), fontSize = 32.sp, fontWeight = FontWeight.Black, modifier = Modifier.clickable { showParty = false })
                Text("Party", color = if (showParty) Color(0xFFFF5B82) else Color(0xFFC9C3C9), fontSize = 32.sp, fontWeight = FontWeight.Black, modifier = Modifier.clickable { showParty = true })
            }
            Text("⌕   ★", color = Color(0xFF3E3540), fontSize = 26.sp)
        }
        if (showParty) {
            PartyRoomGrid(modifier = Modifier.padding(top = 18.dp))
            return@Column
        }
        Row(modifier = Modifier.padding(top = 18.dp).fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("India", "South Asian", "East Asian", "White", "Black").forEachIndexed { index, label ->
                Text(label, color = if (index == 0) Color.White else Color(0xFF888188), fontWeight = FontWeight.SemiBold, modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(if (index == 0) Color(0xFFBD32E8) else Color(0xFFF0EFF0)).padding(horizontal = 16.dp, vertical = 10.dp))
            }
        }
        Box(modifier = Modifier.padding(top = 16.dp).fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Brush.horizontalGradient(listOf(Color(0xFFFFE8A5), Color(0xFFFFF8EC)))).padding(16.dp)) {
            Column { Text("Multi-show preview", fontWeight = FontWeight.Bold, fontSize = 18.sp); Text("See the rooms getting lively now.", color = Color(0xFF6D626B), fontSize = 13.sp) }
        }
        LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = Modifier.padding(top = 14.dp), verticalArrangement = Arrangement.spacedBy(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(rooms) { room ->
                Box(modifier = Modifier.height(220.dp).clip(RoundedCornerShape(16.dp)).background(Brush.verticalGradient(listOf(room.second.copy(alpha = 0.62f), room.second, Color(0xFF231227)))).padding(13.dp)) {
                    Text("● 186K", color = Color.White, fontSize = 12.sp, modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color.Black.copy(alpha = 0.25f)).padding(horizontal = 8.dp, vertical = 4.dp))
                    Column(modifier = Modifier.align(Alignment.BottomStart)) { Text(room.first, color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp); Text("India · English", color = Color.White.copy(alpha = 0.85f), fontSize = 12.sp) }
                }
            }
        }
    }
}
