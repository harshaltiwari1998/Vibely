package com.vibely.app.ui.live

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.widget.Toast
import com.vibely.app.data.remote.dto.LiveRoomResponse
import com.vibely.app.ui.party.PartyRoomGrid
import com.vibely.app.ui.viewmodel.LiveFeedViewModel
import com.vibely.app.ui.viewmodel.UiState

private enum class LiveSection { LIVE, PARTY, FAMILY }

@Composable
fun LiveFeedScreen(
    viewModel: LiveFeedViewModel,
    onOpenRoom: (String) -> Unit,
    onGoLive: () -> Unit,
) {
    var section by remember { mutableStateOf(LiveSection.LIVE) }
    var selectedFilter by remember { mutableStateOf(0) }
    val context = LocalContext.current
    val state by viewModel.rooms.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Live", color = if (section == LiveSection.LIVE) Color(0xFFFF5B82) else Color(0xFFC9C3C9), fontSize = 26.sp, fontWeight = FontWeight.Black, modifier = Modifier.clickable { section = LiveSection.LIVE })
                Text("Party", color = if (section == LiveSection.PARTY) Color(0xFFFF5B82) else Color(0xFFC9C3C9), fontSize = 26.sp, fontWeight = FontWeight.Black, modifier = Modifier.clickable { section = LiveSection.PARTY })
                Text("Family", color = if (section == LiveSection.FAMILY) Color(0xFFFF5B82) else Color(0xFFC9C3C9), fontSize = 26.sp, fontWeight = FontWeight.Black, modifier = Modifier.clickable { section = LiveSection.FAMILY })
            }
            Text("⌕", color = Color(0xFF3E3540), fontSize = 24.sp, modifier = Modifier.clickable { Toast.makeText(context, "Use the Search tab to find people", Toast.LENGTH_SHORT).show() })
        }

        if (section == LiveSection.PARTY || section == LiveSection.FAMILY) {
            PartyRoomGrid(modifier = Modifier.padding(top = 18.dp))
        } else {
            Row(modifier = Modifier.padding(top = 16.dp).fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("India", "South Asian", "East Asian", "White", "Black").forEachIndexed { index, label ->
                    Text(label, color = if (index == selectedFilter) Color.White else Color(0xFF888188), fontWeight = FontWeight.SemiBold, modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(if (index == selectedFilter) Color(0xFFBD32E8) else Color(0xFFF0EFF0)).clickable { selectedFilter = index }.padding(horizontal = 16.dp, vertical = 10.dp))
                }
            }

            Button(
                onClick = onGoLive,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF1470)),
                modifier = Modifier.fillMaxWidth().padding(top = 14.dp)
            ) {
                Text("Go Live", fontWeight = FontWeight.Bold, color = Color.White)
            }

            when (state) {
                is UiState.Loading -> {
                    Text("Loading live rooms...", color = Color(0xFF6B7280), modifier = Modifier.padding(top = 24.dp))
                }
                is UiState.Error -> {
                    Column(modifier = Modifier.padding(top = 24.dp)) {
                        Text((state as UiState.Error).message, color = Color(0xFFEF4444))
                        Text("Retry", color = Color(0xFF7C3AED), modifier = Modifier.clickable { viewModel.retry() })
                    }
                }
                is UiState.Success -> {
                    val rooms = (state as UiState.Success<List<LiveRoomResponse>>).data
                    if (rooms.isEmpty()) {
                        Text("No one is live right now. Be the first!", color = Color(0xFF6B7280), modifier = Modifier.padding(top = 24.dp))
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            modifier = Modifier.padding(top = 16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(rooms) { room ->
                                Box(
                                    modifier = Modifier
                                        .aspectRatio(0.75f)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Brush.verticalGradient(listOf(Color(0xFF4A0E5C), Color(0xFF1B0620))))
                                        .clickable { onOpenRoom(room.id) }
                                ) {
                                    Text(
                                        "🔴 LIVE",
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.align(Alignment.TopStart).padding(8.dp)
                                    )
                                    Text(
                                        "👁 ${room.peakViewers}",
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                                    )
                                    Column(modifier = Modifier.align(Alignment.BottomStart).padding(10.dp)) {
                                        Text(room.title, color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp, maxLines = 1)
                                        Text("@${room.host.username}", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp, maxLines = 1)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
