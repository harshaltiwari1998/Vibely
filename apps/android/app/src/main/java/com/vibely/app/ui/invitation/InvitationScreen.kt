package com.vibely.app.ui.invitation

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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

@Composable
fun InvitationScreen() {
    val context = LocalContext.current
    var copied by remember { mutableStateOf(false) }
    var rulesOpen by remember { mutableStateOf(false) }
    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Column(modifier = Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color(0xFFFF4D3C), Color(0xFFFFAB27), Color(0xFFFFDF75)))).padding(horizontal = 20.dp, vertical = 34.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("JHOLAMET LIVE", color = Color.White.copy(alpha = 0.85f), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text("Invite Rewards", color = Color.White, fontWeight = FontWeight.Black, fontSize = 36.sp)
            Text("Invite friends. Share the rewards.", color = Color.White, fontSize = 14.sp)
        }
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                RewardPanel("0%", "Earn up to 8% of each friend's recharge", Color(0xFFFAF2FF), Modifier.weight(1f))
                RewardPanel("Card x10", "For every friend you invite", Color(0xFFFFF7E5), Modifier.weight(1f))
            }
            Text("Your invitation code", color = Color(0xFF17121B), fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 35.dp))
            Text(if (copied) "COPIED" else "AV5LZF", color = Color(0xFFFF6417), textAlign = TextAlign.Center, fontSize = 31.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 14.dp).fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color(0xFFFFF1AC)).clickable { (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Invitation code", "AV5LZF")); copied = true }.padding(vertical = 19.dp))
            Text("New friends can use your code within 3 days of registering.", color = Color(0xFFAD73DD), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 16.dp))
            Text(if (rulesOpen) "Hide rules" else "View rules", color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 20.dp).clip(RoundedCornerShape(24.dp)).background(Brush.horizontalGradient(listOf(Color(0xFFDB4FF2), Color(0xFF9346EB)))).clickable { rulesOpen = !rulesOpen }.padding(horizontal = 28.dp, vertical = 12.dp))
            if (rulesOpen) {
                Column(modifier = Modifier.padding(top = 16.dp).fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0xFFFFF8DD)).padding(16.dp)) {
                    Text("Recharge commission rewards", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Your reward is based on friends' completed recharges.", modifier = Modifier.padding(top = 6.dp))
                    Text("Less than 60,500 diamonds: 0%\n60,500 to 2,755,500 diamonds: 3%\n2,755,500 to 11,005,500 diamonds: 5%\nMore than 11,005,500 diamonds: 8%", lineHeight = 24.sp, modifier = Modifier.padding(top = 12.dp))
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
