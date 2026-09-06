package com.vibely.app.ui.call

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.vibely.app.ui.viewmodel.CallViewModel
import com.vibely.app.ui.viewmodel.UiState

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CallScreen(viewModel: CallViewModel) {
    val state by viewModel.history.collectAsState()
    val context = LocalContext.current
    val callPermissions = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when (state) {
            is UiState.Loading -> {
                Spacer(modifier = Modifier.height(40.dp))
                Text("Loading...", color = Color(0xFF6B7280))
            }
            is UiState.Error -> {
                Spacer(modifier = Modifier.height(40.dp))
                Text((state as UiState.Error).message, color = Color(0xFFEF4444))
            }
            is UiState.Success -> {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Start a call", fontWeight = FontWeight.Bold, fontSize = 22.sp, color = Color(0xFF111827))
                Spacer(modifier = Modifier.height(24.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable {
                        if (callPermissions.permissions.all { it.status.isGranted }) {
                            /* start audio call */
                        } else {
                            callPermissions.launchMultiplePermissionRequest()
                        }
                    }) {
                        Box(modifier = Modifier.size(72.dp).clip(CircleShape).background(Color(0xFFDCFCE7)), contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Filled.Call, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(32.dp))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Voice", fontSize = 14.sp, color = Color(0xFF374151), fontWeight = FontWeight.Medium)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable {
                        if (callPermissions.permissions.all { it.status.isGranted }) {
                            /* start video call */
                        } else {
                            callPermissions.launchMultiplePermissionRequest()
                        }
                    }) {
                        Box(modifier = Modifier.size(72.dp).clip(CircleShape).background(Color(0xFFDBEAFE)), contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Filled.Videocam, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(32.dp))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Video", fontSize = 14.sp, color = Color(0xFF374151), fontWeight = FontWeight.Medium)
                    }
                }
                if (!callPermissions.permissions.all { it.status.isGranted }) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                data = Uri.fromParts("package", context.packageName, null)
                            }
                            context.startActivity(intent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Grant permissions", color = Color.White)
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text("Recent calls", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF111827))
                Spacer(modifier = Modifier.height(12.dp))
                val logs = (state as UiState.Success).data
                logs.forEach { log ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = if (log.type.name == "VIDEO") Icons.Filled.Videocam else Icons.Filled.Call, contentDescription = null, tint = Color(0xFF7C3AED))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(text = "${log.userId} · ${log.status.name}", modifier = Modifier.weight(1f), color = Color(0xFF111827))
                        Text(text = "${log.durationSeconds}s", color = Color(0xFF6B7280), fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}
