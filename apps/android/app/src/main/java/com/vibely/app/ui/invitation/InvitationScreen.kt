package com.vibely.app.ui.invitation

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.ReferralViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun InvitationScreen(viewModel: ReferralViewModel, onBack: () -> Unit = {}) {
    val context = LocalContext.current
    var copied by remember { mutableStateOf(false) }
    var rulesOpen by remember { mutableStateOf(false) }
    val state by viewModel.info.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
            Text("‹", color = Color(0xFF111827), fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 16.dp).clickable { onBack() })
            Text("Invitation", color = Color(0xFF111827), fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            Text("Rule", color = Color(0xFF111827), fontSize = 16.sp, modifier = Modifier.align(Alignment.CenterEnd).padding(end = 20.dp).clickable { rulesOpen = !rulesOpen })
        }
        Column(modifier = Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color(0xFFFF4D3C), Color(0xFFFFAB27), Color(0xFFFFDF75)))).padding(horizontal = 20.dp, vertical = 28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("VIBELY", color = Color.White.copy(alpha = 0.85f), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text("Invite Rewards", color = Color.White, fontWeight = FontWeight.Black, fontSize = 32.sp)
        }
        when (val s = state) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280), modifier = Modifier.padding(24.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(24.dp))
            is UiState.Success -> {
                val info = s.data
                Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        RewardPanel("💎 ${info.referrerBonus}", "For every friend you invite", Color(0xFFFAF2FF), Modifier.weight(1f))
                        RewardPanel("💎 ${info.refereeBonus}", "Your friend gets, too", Color(0xFFFFF7E5), Modifier.weight(1f))
                    }
                    Text("${info.invitedCount} friends invited · 💎 ${info.totalEarned} earned", color = Color(0xFF625B63), fontSize = 13.sp, modifier = Modifier.padding(top = 12.dp))
                    Text("Your invitation code", color = Color(0xFF17121B), fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 24.dp))
                    Text(
                        if (copied) "COPIED" else info.code,
                        color = Color(0xFFFF6417),
                        textAlign = TextAlign.Center,
                        fontSize = 31.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier
                            .padding(top = 14.dp)
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFFFF1AC))
                            .clickable {
                                (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager)
                                    .setPrimaryClip(ClipData.newPlainText("Invitation code", info.code))
                                copied = true
                            }
                            .padding(vertical = 19.dp)
                    )
                    Text("New friends may enter your invitation code when they sign up to bind with you.", color = Color(0xFFAD73DD), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 16.dp))
                    if (rulesOpen) {
                        Column(modifier = Modifier.padding(top = 16.dp).fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0xFFFFF8DD)).padding(16.dp)) {
                            Text("Invite rewards", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text("Share your code with a friend before they sign up.", modifier = Modifier.padding(top = 6.dp))
                            Text("They enter it on the sign-up screen. Once their account is created, you get 💎 ${info.referrerBonus} and they get 💎 ${info.refereeBonus} — instantly, once per friend.", lineHeight = 22.sp, modifier = Modifier.padding(top = 12.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RewardPanel(title: String, note: String, color: Color, modifier: Modifier) {
    Column(modifier = modifier.clip(RoundedCornerShape(14.dp)).background(color).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(title, color = Color(0xFF332A3A), fontWeight = FontWeight.Black, fontSize = 23.sp, textAlign = TextAlign.Center)
        Text(note, color = Color(0xFF625B63), textAlign = TextAlign.Center, fontSize = 13.sp, modifier = Modifier.padding(top = 14.dp))
    }
}
