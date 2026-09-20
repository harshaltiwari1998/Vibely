package com.vibely.app.ui.call

import android.Manifest
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.viewinterop.AndroidView
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.webrtc.PeerConnectionClient
import io.socket.client.Socket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.webrtc.IceCandidate
import org.webrtc.PeerConnection
import org.webrtc.SessionDescription
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoTrack
import com.vibely.app.data.realtime.SocketManager

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CallScreen(callId: String, peerId: String, isInitiator: Boolean, onEnded: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val permissions = rememberMultiplePermissionsState(
        permissions = listOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    )

    var callState by remember { mutableStateOf("connecting") }
    var muted by remember { mutableStateOf(false) }
    var camOff by remember { mutableStateOf(false) }
    val pcClient = remember { PeerConnectionClient(context) }
    var localRenderer by remember { mutableStateOf<SurfaceViewRenderer?>(null) }
    var remoteRenderer by remember { mutableStateOf<SurfaceViewRenderer?>(null) }
    var pendingRemoteTrack by remember { mutableStateOf<VideoTrack?>(null) }
    var signalSocket by remember { mutableStateOf<Socket?>(null) }
    var defaultSocket by remember { mutableStateOf<Socket?>(null) }

    DisposableEffect(Unit) {
        onDispose {
            pcClient.dispose()
            localRenderer?.release()
            remoteRenderer?.release()
        }
    }

    LaunchedEffect(Unit) {
        if (!permissions.allPermissionsGranted) {
            permissions.launchMultiplePermissionRequest()
        }
    }

    // Re-runs once permission state flips to granted; does nothing (and
    // starts no resources that would need cleanup) while still waiting.
    LaunchedEffect(callId, permissions.allPermissionsGranted) {
        if (!permissions.allPermissionsGranted) return@LaunchedEffect

        val tokenManager = TokenManager(context)
        val token = tokenManager.getAccessToken().orEmpty()
        val baseUrl = ApiClient.socketBaseUrl()
        val defaultSock = SocketManager.getDefaultSocket(baseUrl, token)
        val signalSock = SocketManager.getSignalSocket(baseUrl, token)
        defaultSocket = defaultSock
        signalSocket = signalSock

        pcClient.initialize(
            listOf(PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer())
        )
        pcClient.onIceCandidate = { candidate: IceCandidate ->
            val payload = JSONObject().apply {
                put("callId", callId)
                put("toUserId", peerId)
                put("candidate", JSONObject().apply {
                    put("candidate", candidate.sdp)
                    put("sdpMid", candidate.sdpMid)
                    put("sdpMLineIndex", candidate.sdpMLineIndex)
                })
            }
            signalSock.emit("ice_candidate", payload)
        }
        pcClient.onRemoteVideoTrack = { track: VideoTrack ->
            scope.launch(Dispatchers.Main) {
                val renderer = remoteRenderer
                if (renderer != null) {
                    track.addSink(renderer)
                } else {
                    pendingRemoteTrack = track
                }
                callState = "connected"
            }
        }
        pcClient.onConnectionStateChange = { state: PeerConnection.PeerConnectionState ->
            scope.launch(Dispatchers.Main) {
                callState = when (state) {
                    PeerConnection.PeerConnectionState.CONNECTED -> "connected"
                    PeerConnection.PeerConnectionState.FAILED -> "failed"
                    PeerConnection.PeerConnectionState.DISCONNECTED -> "reconnecting"
                    else -> "connecting"
                }
            }
        }

        val localTrack = try {
            withContext(Dispatchers.Main) { pcClient.startLocalMedia() }
        } catch (e: Exception) {
            callState = "failed"
            return@LaunchedEffect
        }
        localRenderer?.let { localTrack.addSink(it) }

        signalSock.on("call_offer") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            val sdpObj = data.optJSONObject("sdp") ?: return@on
            val remoteSdp = SessionDescription(
                SessionDescription.Type.fromCanonicalForm(sdpObj.optString("type")),
                sdpObj.optString("sdp"),
            )
            scope.launch {
                val answer = pcClient.createAnswer(remoteSdp)
                val payload = JSONObject().apply {
                    put("callId", callId)
                    put("toUserId", peerId)
                    put("sdp", JSONObject().apply {
                        put("type", answer.type.canonicalForm())
                        put("sdp", answer.description)
                    })
                }
                signalSock.emit("call_answer", payload)
            }
        }
        signalSock.on("call_answer") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            val sdpObj = data.optJSONObject("sdp") ?: return@on
            val remoteSdp = SessionDescription(
                SessionDescription.Type.fromCanonicalForm(sdpObj.optString("type")),
                sdpObj.optString("sdp"),
            )
            pcClient.setRemoteDescription(remoteSdp)
        }
        signalSock.on("ice_candidate") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            val candidateObj = data.optJSONObject("candidate") ?: return@on
            pcClient.addIceCandidate(
                IceCandidate(
                    candidateObj.optString("sdpMid"),
                    candidateObj.optInt("sdpMLineIndex"),
                    candidateObj.optString("candidate"),
                )
            )
        }
        signalSock.on("call_ready") {
            scope.launch(Dispatchers.Main) { callState = "connecting" }
        }

        defaultSock.on("call_ended") {
            scope.launch(Dispatchers.Main) { onEnded() }
        }
        defaultSock.on("call_failed") {
            scope.launch(Dispatchers.Main) {
                callState = "failed"
                onEnded()
            }
        }

        if (isInitiator) {
            val offer = pcClient.createOffer()
            val payload = JSONObject().apply {
                put("callId", callId)
                put("toUserId", peerId)
                put("sdp", JSONObject().apply {
                    put("type", offer.type.canonicalForm())
                    put("sdp", offer.description)
                })
            }
            signalSock.emit("call_offer", payload)
        } else {
            signalSock.emit("call_ready", JSONObject().put("callId", callId))
        }
    }

    fun endCall() {
        signalSocket?.emit("call_end", JSONObject().put("callId", callId))
        onEnded()
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.weight(1f).aspectRatio(0.75f).background(Color.Black)) {
                AndroidView(
                    factory = { ctx ->
                        SurfaceViewRenderer(ctx).also { view ->
                            view.init(pcClient.eglBase.eglBaseContext, null)
                            view.setMirror(true)
                            localRenderer = view
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
            Box(modifier = Modifier.weight(1f).aspectRatio(0.75f).background(Color.Black).padding(start = 4.dp)) {
                AndroidView(
                    factory = { ctx ->
                        SurfaceViewRenderer(ctx).also { view ->
                            view.init(pcClient.eglBase.eglBaseContext, null)
                            remoteRenderer = view
                            pendingRemoteTrack?.let { it.addSink(view) }
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        Text(
            text = when (callState) {
                "connected" -> "Connected"
                "failed" -> "Call failed"
                "reconnecting" -> "Reconnecting..."
                else -> "Connecting..."
            },
            modifier = Modifier.padding(top = 12.dp),
        )

        Row(modifier = Modifier.padding(top = 12.dp)) {
            Button(onClick = {
                muted = !muted
                pcClient.muteAudio(muted)
            }) { Text(if (muted) "Unmute" else "Mute") }
            Button(onClick = {
                camOff = !camOff
                pcClient.muteVideo(camOff)
            }, modifier = Modifier.padding(start = 8.dp)) { Text(if (camOff) "Camera on" else "Camera off") }
            Button(onClick = { pcClient.switchCamera() }, modifier = Modifier.padding(start = 8.dp)) {
                Text("Switch camera")
            }
            Button(
                onClick = { endCall() },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                modifier = Modifier.padding(start = 8.dp),
            ) { Text("End call") }
        }
    }
}
