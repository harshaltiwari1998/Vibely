package com.vibely.app.ui.party

import android.widget.Toast
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.data.remote.dto.PartyRoomResponse
import com.vibely.app.ui.viewmodel.PartyListViewModel
import com.vibely.app.ui.viewmodel.UiState

private val roomColors = listOf(Color(0xFF7A1E12), Color(0xFF2B1B08), Color(0xFFB8319B), Color(0xFF2C1E63))

/** The room grid + "start a room" tile, used standalone or embedded in the Live feed's Party tab. */
@Composable
fun PartyRoomsContent(viewModel: PartyListViewModel, onOpenRoom: (String) -> Unit, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val state by viewModel.rooms.collectAsState()
    val starting by viewModel.starting.collectAsState()
    val startedRoomId by viewModel.startedRoomId.collectAsState()
    val message by viewModel.message.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var titleInput by remember { mutableStateOf("") }

    LaunchedEffect(startedRoomId) {
        startedRoomId?.let {
            onOpenRoom(it)
            viewModel.consumeStartedRoomId()
        }
    }
    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    Column(modifier = modifier) {
        when (val s = state) {
            is UiState.Loading -> Text("Loading rooms...", color = Color(0xFF6B7280))
            is UiState.Error -> Column {
                Text(s.message, color = Color(0xFFEF4444))
                Text("Retry", color = Color(0xFF7C3AED), modifier = Modifier.clickable { viewModel.retry() })
            }
            is UiState.Success -> {}
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.padding(top = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Column(
                    modifier = Modifier
                        .aspectRatio(0.72f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Brush.verticalGradient(listOf(Color(0xFF5B3A0A), Color(0xFF1B1204))))
                        .clickable(enabled = !starting) { showCreateDialog = true }
                        .padding(14.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Bottom
                ) {
                    Text(if (starting) "Starting..." else "+ Start a room", color = Color(0xFFD8A94A), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
            if (state is UiState.Success) {
                items((state as UiState.Success<List<PartyRoomResponse>>).data) { room ->
                    val color = roomColors[room.id.hashCode().mod(roomColors.size)]
                    Box(
                        modifier = Modifier
                            .aspectRatio(0.72f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Brush.verticalGradient(listOf(color.copy(alpha = 0.5f), color)))
                            .clickable { onOpenRoom(room.id) }
                    ) {
                        Column(modifier = Modifier.align(Alignment.BottomStart).padding(12.dp)) {
                            Text("👥 ${room.memberCount}/${room.seatCount}", color = Color.White, fontSize = 12.sp)
                            Text(room.title, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp, maxLines = 1)
                            Text("@${room.host.username}", color = Color.White.copy(alpha = 0.85f), fontSize = 11.sp, maxLines = 1)
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Start a voice room") },
            text = {
                OutlinedTextField(
                    value = titleInput,
                    onValueChange = { titleInput = it },
                    label = { Text("Room title") }
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.startParty(titleInput)
                    showCreateDialog = false
                    titleInput = ""
                }) { Text("Start") }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun PartyScreen(viewModel: PartyListViewModel, onOpenRoom: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Party  ", color = Color(0xFF3C3A3C), fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Rooms", color = Color(0xFFFF5B82), fontSize = 26.sp, fontWeight = FontWeight.Black)
        }
        PartyRoomsContent(viewModel = viewModel, onOpenRoom = onOpenRoom, modifier = Modifier.padding(top = 16.dp))
    }
}
