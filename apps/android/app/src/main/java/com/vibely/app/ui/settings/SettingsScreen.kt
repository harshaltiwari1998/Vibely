package com.vibely.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.vibely.app.data.remote.ApiService
import kotlinx.coroutines.launch
import retrofit2.HttpException

const val PRIVACY_POLICY_URL = "https://vibely-app-alpha.vercel.app/privacy"

private fun formatBytes(bytes: Long): String {
    if (bytes < 1024 * 1024) return "${bytes / 1024} KB"
    return "%.1f MB".format(bytes / (1024.0 * 1024.0))
}

private fun clearCacheDir(dir: java.io.File): Long {
    val freed = dir.walkBottomUp().filter { it.isFile }.sumOf { it.length() }
    dir.listFiles()?.forEach { it.deleteRecursively() }
    return freed
}

@Composable
fun SettingsScreen(api: ApiService, onLogout: () -> Unit, onOpenBlacklist: () -> Unit = {}) {
    val context = LocalContext.current
    var showDeleteDialog by remember { mutableStateOf(false) }
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC)).verticalScroll(rememberScrollState())) {
        Text(
            text = "Settings",
            fontWeight = FontWeight.Medium,
            fontSize = 30.sp,
            modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            color = Color(0xFF111827)
        )
        listOf("App Language" to "English", "Account" to "", "Message Notification" to "", "Set password" to "To bind", "Withdrawal password" to "", "Google" to "Connected", "Privacy settings" to "", "Personal blacklist" to "", "Clear cache" to "", "Privacy policy" to "", "About us" to "V1.1.2.2").forEach { (label, value) ->
            Row(
                modifier = Modifier.fillMaxWidth().clickable {
                    when (label) {
                        "Personal blacklist" -> onOpenBlacklist()
                        "Privacy policy" -> context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(PRIVACY_POLICY_URL)))
                        "Clear cache" -> {
                            val freed = clearCacheDir(context.cacheDir)
                            Toast.makeText(context, "Cleared ${formatBytes(freed)}", Toast.LENGTH_SHORT).show()
                        }
                        else -> Toast.makeText(context, "$label is coming soon", Toast.LENGTH_SHORT).show()
                    }
                }.padding(horizontal = 24.dp, vertical = 21.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(label, modifier = Modifier.weight(1f), color = Color(0xFF3C3A3C), fontSize = 21.sp)
                Text(value, color = if (value == "Connected") Color(0xFF14C9A0) else Color(0xFFBDBDBD), fontSize = 15.sp)
                Text("›", color = Color(0xFFC8C8C8), fontSize = 32.sp, modifier = Modifier.padding(start = 10.dp))
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().clickable { onLogout() }.padding(horizontal = 24.dp, vertical = 21.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Log out", modifier = Modifier.weight(1f), color = Color(0xFFEF4444), fontSize = 21.sp, fontWeight = FontWeight.Bold)
        }
        Row(
            modifier = Modifier.fillMaxWidth().clickable { showDeleteDialog = true }.padding(horizontal = 24.dp, vertical = 21.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Delete account", modifier = Modifier.weight(1f), color = Color(0xFF9CA3AF), fontSize = 17.sp)
        }
    }

    if (showDeleteDialog) {
        DeleteAccountDialog(
            api = api,
            onDismiss = { showDeleteDialog = false },
            onDeleted = {
                showDeleteDialog = false
                Toast.makeText(context, "Your account has been deleted", Toast.LENGTH_LONG).show()
                onLogout()
            }
        )
    }
}

@Composable
private fun DeleteAccountDialog(api: ApiService, onDismiss: () -> Unit, onDeleted: () -> Unit) {
    val scope = rememberCoroutineScope()
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var deleting by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = { if (!deleting) onDismiss() },
        title = { Text("Delete account?") },
        text = {
            Column {
                Text(
                    "This permanently deletes your profile, photos, chats access and remaining coins. It cannot be undone. Enter your password to confirm.",
                    fontSize = 14.sp,
                    color = Color(0xFF6B7280)
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; error = null },
                    label = { Text("Password") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    isError = error != null,
                    supportingText = error?.let { { Text(it) } },
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = password.isNotEmpty() && !deleting,
                onClick = {
                    deleting = true
                    scope.launch {
                        try {
                            api.deleteAccount(mapOf("password" to password))
                            onDeleted()
                        } catch (e: HttpException) {
                            error = if (e.code() == 401) "Incorrect password" else "Couldn't delete account (${e.code()})"
                        } catch (e: Exception) {
                            error = e.message ?: "Network error"
                        } finally {
                            deleting = false
                        }
                    }
                }
            ) { Text(if (deleting) "Deleting…" else "Delete", color = Color(0xFFEF4444)) }
        },
        dismissButton = {
            TextButton(enabled = !deleting, onClick = onDismiss) { Text("Cancel") }
        }
    )
}
