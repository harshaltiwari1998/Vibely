package com.vibely.app.ui.party

import android.Manifest
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.realtime.PartyChatEntry
import com.vibely.app.data.realtime.PartySocketSession
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.PartySeatResponse
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import kotlinx.coroutines.launch

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun PartyRoomScreen(api: ApiService, roomId: String, myUserId: String?, onEnded: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val micPermission = rememberPermissionState(Manifest.permission.RECORD_AUDIO)

    var title by remember { mutableStateOf("") }
    var hostId by remember { mutableStateOf("") }
    var seatCount by remember { mutableStateOf(8) }
    var seats by remember { mutableStateOf(listOf<PartySeatResponse>()) }
    var memberCount by remember { mutableStateOf(0) }
    var messages by remember { mutableStateOf(listOf<PartyChatEntry>()) }
    var chatInput by remember { mutableStateOf("") }
    var ended by remember { mutableStateOf(false) }
    var micEnabled by remember { mutableStateOf(false) }
    var liveKitRoom by remember { mutableStateOf<Room?>(null) }
    var socketSession by remember { mutableStateOf<PartySocketSession?>(null) }
    var livekitUrl by remember { mutableStateOf("") }

    val mySeatIndex = seats.firstOrNull { it.userId == myUserId }?.seatIndex
    val isHost = myUserId != null && myUserId == hostId

    DisposableEffect(roomId) {
        onDispose {
            socketSession?.close()
            liveKitRoom?.disconnect()
        }
    }

    LaunchedEffect(roomId) {
        if (!micPermission.status.isGranted) micPermission.launchPermissionRequest()
        try {
            val resp = api.joinParty(roomId)
            if (!resp.success || resp.data == null) {
                ended = true
                return@LaunchedEffect
            }
            val session = resp.data
            title = session.room.title
            hostId = session.room.host.id
            seatCount = session.room.seatCount
            seats = session.seats
            livekitUrl = session.livekitUrl

            val room = LiveKit.create(appContext = context.applicationContext)
            liveKitRoom = room
            room.connect(url = session.livekitUrl, token = session.token)
            val startMic = session.seats.any { it.userId == myUserId }
            room.localParticipant.setMicrophoneEnabled(startMic)
            micEnabled = startMic

            val tokenManager = TokenManager(context)
            val partySocket = PartySocketSession(ApiClient.socketBaseUrl(), tokenManager.getAccessToken().orEmpty(), roomId)
            partySocket.onMemberCountChanged = { count -> memberCount = count }
            partySocket.onSeatsUpdated = { updated -> seats = updated }
            partySocket.onSeatToken = { newToken ->
                scope.launch {
                    liveKitRoom?.disconnect()
                    val reconnected = LiveKit.create(appContext = context.applicationContext)
                    liveKitRoom = reconnected
                    reconnected.connect(url = livekitUrl, token = newToken)
                    reconnected.localParticipant.setMicrophoneEnabled(true)
                    micEnabled = true
                }
            }
            partySocket.onChatMessage = { entry -> messages = (messages + entry).takeLast(50) }
            partySocket.onPartyEnded = { ended = true }
            partySocket.connect()
            socketSession = partySocket
        } catch (e: Exception) {
            ended = true
        }
    }

    fun leaveRoom() {
        scope.launch {
            try { api.leaveParty(roomId) } catch (_: Exception) {}
            socketSession?.close()
            liveKitRoom?.disconnect()
            onEnded()
        }
    }

    fun endRoomAsHost() {
        scope.launch {
            try { api.endParty(roomId) } catch (_: Exception) {}
            socketSession?.close()
            liveKitRoom?.disconnect()
            onEnded()
        }
    }

    if (ended) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("This room has ended.", color = Color(0xFF6B7280))
            Button(onClick = onEnded, modifier = Modifier.padding(top = 12.dp)) { Text("Back") }
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF1B1032)).padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp, maxLines = 1)
                Text("👥 $memberCount members", color = Color(0xFFB9AFC2), fontSize = 12.sp)
            }
            if (isHost) {
                Text("End", color = Color(0xFFFF5B82), fontWeight = FontWeight.Bold, modifier = Modifier.clickable { endRoomAsHost() })
            } else {
                Text("Leave", color = Color(0xFFB9AFC2), fontWeight = FontWeight.Bold, modifier = Modifier.clickable { leaveRoom() })
            }
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.padding(top = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(seatCount) { index ->
                val occupant = seats.firstOrNull { it.seatIndex == index }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .aspectRatio(1f)
                            .background(if (occupant != null) Color(0xFF3B2C63) else Color(0xFF2A2049), CircleShape)
                            .clickable {
                                if (occupant == null) {
                                    socketSession?.takeSeat(index)
                                } else if (occupant.userId == myUserId) {
                                    socketSession?.leaveSeat()
                                    scope.launch { liveKitRoom?.localParticipant?.setMicrophoneEnabled(false) }
                                    micEnabled = false
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (occupant != null) (if (occupant.muted) "🔇" else "🎙") else "+",
                            color = Color.White,
                            fontSize = 18.sp
                        )
                    }
                    Text(
                        occupant?.username ?: "Seat ${index + 1}",
                        color = Color(0xFFB9AFC2),
                        fontSize = 10.sp,
                        maxLines = 1
                    )
                }
            }
        }

        LazyColumn(modifier = Modifier.weight(1f).fillMaxWidth().padding(top = 16.dp)) {
            items(messages) { m ->
                Text("${m.username}: ${m.content}", fontSize = 13.sp, color = Color.White, modifier = Modifier.padding(vertical = 2.dp))
            }
        }

        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            if (mySeatIndex != null) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(if (micEnabled) Color(0xFF22C55E) else Color(0xFF6B7280), CircleShape)
                        .clickable {
                            val next = !micEnabled
                            scope.launch { liveKitRoom?.localParticipant?.setMicrophoneEnabled(next) }
                            socketSession?.toggleMute(!next)
                            micEnabled = next
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (micEnabled) "🎙" else "🔇", fontSize = 16.sp)
                }
            }
            OutlinedTextField(
                value = chatInput,
                onValueChange = { chatInput = it },
                modifier = Modifier.weight(1f).padding(start = 8.dp),
                placeholder = { Text("Say something...", color = Color(0xFF8A8194)) }
            )
            Button(
                onClick = {
                    if (chatInput.isNotBlank()) {
                        socketSession?.sendChat(chatInput.trim())
                        chatInput = ""
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF1470)),
                modifier = Modifier.padding(start = 8.dp)
            ) { Text("Send") }
        }
    }
}
