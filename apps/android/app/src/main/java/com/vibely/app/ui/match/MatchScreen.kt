package com.vibely.app.ui.match

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.MatchViewModel

@Composable
@Suppress("UNUSED_PARAMETER")
fun MatchScreen(viewModel: MatchViewModel) {
    var searching by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF4A0026)).padding(20.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(modifier = Modifier.fillMaxWidth()) {
                Text("💎 4975", color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.align(Alignment.CenterVertically).clip(RoundedCornerShape(24.dp)).background(Color.White.copy(alpha = 0.18f)).padding(horizontal = 16.dp, vertical = 10.dp))
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.weight(1f))
                Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(Color(0xFFFF1470)), contentAlignment = Alignment.Center) { Icon(Icons.Filled.EmojiEvents, null, tint = Color.White) }
            }

            // Dotted world-map globe with an orbiting glossy heart at its center.
            Box(modifier = Modifier.padding(top = 48.dp).size(320.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
                Box(modifier = Modifier.size(300.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFF1A6B7A).copy(alpha = 0.35f), Color(0xFF4A0026).copy(alpha = 0f)))))
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Brush.linearGradient(listOf(Color(0xFFE85BF0), Color(0xFFA84CEA), Color(0xFF6438D6)))),
                    contentAlignment = Alignment.Center
                ) { Text("♥", color = Color.White, fontSize = 76.sp) }
                Box(modifier = Modifier.size(220.dp).clip(CircleShape).background(Color.Transparent))
                Text("💗", fontSize = 22.sp, modifier = Modifier.align(Alignment.TopStart).padding(top = 30.dp, start = 10.dp))
                Text("💗", fontSize = 26.sp, modifier = Modifier.align(Alignment.TopEnd).padding(top = 60.dp, end = 4.dp))
                Text("💗", fontSize = 18.sp, modifier = Modifier.align(Alignment.BottomEnd).padding(bottom = 40.dp, end = 20.dp))
            }

            Text(
                "861 girl waiting for a match",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .padding(top = 40.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color(0xFFCE2876).copy(alpha = 0.85f))
                    .padding(horizontal = 22.dp, vertical = 12.dp)
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .padding(top = 22.dp)
                    .fillMaxWidth(0.82f)
                    .clip(RoundedCornerShape(34.dp))
                    .background(Brush.horizontalGradient(listOf(Color(0xFFFF8A13), Color(0xFFFF1877), Color(0xFFFF382C))))
                    .clickable { searching = !searching }
                    .padding(vertical = 16.dp),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(if (searching) "Cancel search" else "Random match", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Text("💎 600", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
                Text("LIVE", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(start = 14.dp).clip(RoundedCornerShape(8.dp)).background(Color.White.copy(alpha = 0.25f)).padding(horizontal = 8.dp, vertical = 4.dp))
            }
        }
    }
}

