package com.vibely.app.ui.live

import android.Manifest
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.viewinterop.AndroidView
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.realtime.LiveSocketSession
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.StartLiveRequest
import io.livekit.android.LiveKit
import io.livekit.android.renderer.TextureViewRenderer
import io.livekit.android.room.Room
import io.livekit.android.room.track.Track
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.launch

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun GoLiveScreen(api: ApiService, onEnded: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val permissions = rememberMultiplePermissionsState(
        permissions = listOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    )

    var title by remember { mutableStateOf("") }
    var roomId by remember { mutableStateOf<String?>(null) }
    var viewerCount by remember { mutableStateOf(0) }
    var starting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var liveKitRoom by remember { mutableStateOf<Room?>(null) }
    var socketSession by remember { mutableStateOf<LiveSocketSession?>(null) }
    var renderer by remember { mutableStateOf<TextureViewRenderer?>(null) }

    DisposableEffect(Unit) {
        onDispose {
            socketSession?.close()
            liveKitRoom?.disconnect()
        }
    }

    fun startLive() {
        if (title.isBlank()) {
            error = "Give your live a title first"
            return
        }
        if (!permissions.permissions.all { it.status.isGranted }) {
            permissions.launchMultiplePermissionRequest()
            return
        }
        starting = true
        error = null
        scope.launch {
            try {
                val resp = api.startLive(StartLiveRequest(title = title.trim()))
                if (!resp.success || resp.data == null) {
                    error = resp.message ?: "Failed to start live"
                    return@launch
                }
                val session = resp.data
                roomId = session.room.id

                val room = LiveKit.create(appContext = context.applicationContext)
                liveKitRoom = room
                room.connect(url = session.livekitUrl, token = session.token)
                room.localParticipant.setCameraEnabled(true)
                room.localParticipant.setMicrophoneEnabled(true)
                renderer?.let { r ->
                    room.localParticipant.getTrackPublication(Track.Source.CAMERA)
                        ?.track?.let { (it as? VideoTrack)?.addRenderer(r) }
                }

                val tokenManager = TokenManager(context)
                val liveSocket = LiveSocketSession(ApiClient.socketBaseUrl(), tokenManager.getAccessToken().orEmpty(), session.room.id)
                liveSocket.onViewerCountChanged = { count -> viewerCount = count }
                liveSocket.connect()
                socketSession = liveSocket
            } catch (e: Exception) {
                error = e.message ?: "Failed to start live"
            } finally {
                starting = false
            }
        }
    }

    fun endLive() {
        val id = roomId ?: return
        scope.launch {
            try {
                api.endLive(id)
            } catch (_: Exception) {
            }
            socketSession?.close()
            liveKitRoom?.disconnect()
            socketSession = null
            liveKitRoom = null
            roomId = null
            onEnded()
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Box(modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).background(Color.Black)) {
            AndroidView(
                factory = { ctx ->
                    TextureViewRenderer(ctx).also { view ->
                        renderer = view
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
            if (roomId != null) {
                Text(
                    "🔴 LIVE · 👁 $viewerCount",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.align(Alignment.TopStart).padding(8.dp)
                )
            }
        }

        if (roomId == null) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("What's your live about?") },
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
            )
            error?.let { Text(it, color = Color(0xFFEF4444), modifier = Modifier.padding(top = 8.dp)) }
            Button(
                onClick = { startLive() },
                enabled = !starting,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF1470)),
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            ) {
                Text(if (starting) "Starting..." else "Start Live", color = Color.White, fontWeight = FontWeight.Bold)
            }
        } else {
            Button(
                onClick = { endLive() },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF374151)),
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
            ) {
                Text("End Live", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}
