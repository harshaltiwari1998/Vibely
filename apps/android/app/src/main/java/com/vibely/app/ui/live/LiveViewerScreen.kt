package com.vibely.app.ui.live

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.viewinterop.AndroidView
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.realtime.LiveChatEntry
import com.vibely.app.data.realtime.LiveGiftEvent
import com.vibely.app.data.realtime.LiveSocketSession
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.GiftResponse
import io.livekit.android.LiveKit
import io.livekit.android.renderer.TextureViewRenderer
import io.livekit.android.room.Room
import io.livekit.android.room.track.RemoteVideoTrack
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.launch

@Composable
fun LiveViewerScreen(api: ApiService, roomId: String, onEnded: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var hostName by remember { mutableStateOf("") }
    var viewerCount by remember { mutableStateOf(0) }
    var messages by remember { mutableStateOf(listOf<LiveChatEntry>()) }
    var chatInput by remember { mutableStateOf("") }
    var gifts by remember { mutableStateOf(listOf<GiftResponse>()) }
    var showGifts by remember { mutableStateOf(false) }
    var ended by remember { mutableStateOf(false) }
    var renderer by remember { mutableStateOf<TextureViewRenderer?>(null) }
    var liveKitRoom by remember { mutableStateOf<Room?>(null) }
    var socketSession by remember { mutableStateOf<LiveSocketSession?>(null) }

    DisposableEffect(roomId) {
        onDispose {
            socketSession?.close()
            liveKitRoom?.disconnect()
        }
    }

    LaunchedEffect(roomId) {
        try {
            val resp = api.joinLive(roomId)
            if (!resp.success || resp.data == null) {
                ended = true
                return@LaunchedEffect
            }
            val session = resp.data
            hostName = session.room.host.username

            val room = LiveKit.create(appContext = context.applicationContext)
            liveKitRoom = room
            room.connect(url = session.livekitUrl, token = session.token)

            val tokenManager = TokenManager(context)
            val liveSocket = LiveSocketSession(ApiClient.socketBaseUrl(), tokenManager.getAccessToken().orEmpty(), roomId)
            liveSocket.onViewerCountChanged = { count -> viewerCount = count }
            liveSocket.onChatMessage = { entry -> messages = (messages + entry).takeLast(50) }
            liveSocket.onGift = { gift: LiveGiftEvent ->
                messages = (messages + LiveChatEntry("", "🎁", "${gift.senderName} sent ${gift.iconUrl} ${gift.giftName}")).takeLast(50)
            }
            liveSocket.onLiveEnded = { ended = true }
            liveSocket.connect()
            socketSession = liveSocket
        } catch (e: Exception) {
            ended = true
        }

        try {
            val giftsResp = api.listGifts()
            if (giftsResp.success && giftsResp.data != null) gifts = giftsResp.data
        } catch (_: Exception) {
        }
    }

    if (ended) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("This live has ended.", color = Color(0xFF6B7280))
            Button(onClick = onEnded, modifier = Modifier.padding(top = 12.dp)) {
                Text("Back to Live")
            }
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Box(modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).background(Color.Black)) {
            AndroidView(
                factory = { ctx ->
                    TextureViewRenderer(ctx).also { view ->
                        renderer = view
                        liveKitRoom?.let { room ->
                            room.remoteParticipants.values.firstOrNull()?.trackPublications?.values
                                ?.firstOrNull { it.track is RemoteVideoTrack }
                                ?.track?.let { (it as? VideoTrack)?.addRenderer(view) }
                        }
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
            Text(
                "🔴 LIVE · 👁 $viewerCount",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp)
            )
            Text("@$hostName", color = Color.White, modifier = Modifier.align(Alignment.TopEnd).padding(8.dp))
        }

        LazyColumn(modifier = Modifier.fillMaxWidth().height(160.dp).padding(top = 8.dp)) {
            items(messages) { m ->
                Text("${m.username}: ${m.content}", fontSize = 13.sp, color = Color(0xFF111827))
            }
        }

        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = chatInput,
                onValueChange = { chatInput = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Say something...") }
            )
            Button(onClick = {
                if (chatInput.isNotBlank()) {
                    socketSession?.sendChat(chatInput.trim())
                    chatInput = ""
                }
            }, modifier = Modifier.padding(start = 8.dp)) {
                Text("Send")
            }
            Button(
                onClick = { showGifts = !showGifts },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF1470)),
                modifier = Modifier.padding(start = 8.dp)
            ) {
                Text("🎁")
            }
        }

        if (showGifts) {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                items(gifts) { gift ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .background(Color(0xFFF3F4F6))
                            .padding(8.dp)
                    ) {
                        Text(gift.iconUrl, fontSize = 20.sp)
                        Text("${gift.coinCost}", fontSize = 10.sp, color = Color(0xFF6B7280))
                        Button(onClick = {
                            socketSession?.sendGift(gift.id)
                            showGifts = false
                        }, modifier = Modifier.padding(top = 4.dp)) {
                            Text("Send", fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }
}
