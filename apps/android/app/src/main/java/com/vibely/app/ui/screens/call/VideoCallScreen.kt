package com.vibely.app.ui.screens.call

import android.Manifest
import android.content.pm.PackageManager
import android.view.View
import android.widget.FrameLayout
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory
import org.webrtc.EglBase
import org.webrtc.SurfaceViewRenderer

@Composable
fun VideoCallScreen() {
    val container = rememberContainer()
    val vm: CallViewModel = viewModel(factory = vmFactory { CallViewModel(container.context, container.sessionPreferences, container.callSocketManager) })
    val state by vm.state.collectAsState()

    var localRenderer by remember { mutableStateOf<SurfaceViewRenderer?>(null) }
    var remoteRenderer by remember { mutableStateOf<SurfaceViewRenderer?>(null) }
    var eglBase by remember { mutableStateOf<EglBase?>(null) }

    val permissions = arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    var hasPermissions by remember { mutableStateOf(permissions.all { ContextCompat.checkSelfPermission(container.context, it) == PackageManager.PERMISSION_GRANTED }) }

    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermission()) { grants ->
        hasPermissions = grants.all { it.value }
    }

    LaunchedEffect(Unit) {
        if (!hasPermissions) {
            launcher.launch(permissions)
        }
    }

    LaunchedEffect(state.callState) {
        if (state.callState == CallState.CONNECTED || state.callState == CallState.CONNECTING) {
            eglBase = EglBase.create()
            localRenderer?.init(eglBase?.eglBaseContext, null)
            localRenderer?.setZOrderMediaOverlay(true)
            remoteRenderer?.init(eglBase?.eglBaseContext, null)
        }
    }

    Screen(title = "Video call", showTopBar = false) {
        if (!hasPermissions) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Camera and microphone permissions are required.")
                    Button(onClick = { launcher.launch(permissions) }) { Text("Grant permissions") }
                }
            }
            return@Screen
        }

        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    FrameLayout(ctx).apply {
                        layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

                        remoteRenderer = SurfaceViewRenderer(ctx).apply {
                            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
                            setMirror(false)
                        }
                        addView(remoteRenderer)

                        localRenderer = SurfaceViewRenderer(ctx).apply {
                            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                                gravity = android.view.Gravity.TOP or android.view.Gravity.END
                                val size = (120 * ctx.resources.displayMetrics.density).toInt()
                                width = size
                                height = size
                                setMargins((8 * ctx.resources.displayMetrics.density).toInt(), (8 * ctx.resources.displayMetrics.density).toInt(), 0, 0)
                            }
                            setZOrderMediaOverlay(true)
                            setMirror(true)
                        }
                        addView(localRenderer)

                        post {
                            remoteRenderer?.setScalingType(org.webrtc.RendererCommon.ScalingType.SCALE_ASPECT_FILL)
                            localRenderer?.setScalingType(org.webrtc.RendererCommon.ScalingType.SCALE_ASPECT_FILL)
                        }
                    }
                },
                update = { },
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = when (state.callState) {
                        CallState.CONNECTING -> "Connecting..."
                        CallState.CONNECTED -> "${state.elapsedSeconds / 60}:${(state.elapsedSeconds % 60).toString().padStart(2, '0')}"
                        CallState.RECONNECTING -> "Reconnecting..."
                        CallState.FAILED -> "Call failed"
                        CallState.ENDED -> "Call ended"
                        else -> ""
                    },
                    color = Color.White,
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.5f)).padding(horizontal = 12.dp, vertical = 4.dp),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    IconButton(onClick = vm::toggleAudio) {
                        Icon(
                            imageVector = if (state.audioMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = if (state.audioMuted) "Unmute" else "Mute",
                            tint = Color.White,
                        )
                    }
                    IconButton(onClick = vm::toggleVideo) {
                        Icon(
                            imageVector = if (state.videoMuted) Icons.Default.VideocamOff else Icons.Default.Videocam,
                            contentDescription = if (state.videoMuted) "Camera on" else "Camera off",
                            tint = Color.White,
                        )
                    }
                    IconButton(onClick = vm::switchCamera) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.Cameraswitch,
                            contentDescription = "Switch camera",
                            tint = Color.White,
                        )
                    }
                    IconButton(onClick = vm::endCall) {
                        Icon(
                            imageVector = Icons.Default.CallEnd,
                            contentDescription = "End call",
                            tint = Color.Red,
                        )
                    }
                }
            }
        }
    }
}
