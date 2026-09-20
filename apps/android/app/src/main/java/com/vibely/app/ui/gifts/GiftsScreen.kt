package com.vibely.app.ui.gifts

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.widget.Toast
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.GiftResponse

@Composable
fun GiftsScreen(api: ApiService) {
    val context = LocalContext.current
    var gifts by remember { mutableStateOf<List<GiftResponse>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        loading = true
        try {
            val resp = api.listGifts()
            if (resp.success && resp.data != null) gifts = resp.data
        } catch (_: Exception) {
        }
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC)).padding(16.dp)) {
        Text("Gifts", fontWeight = FontWeight.Bold, fontSize = 22.sp, color = Color(0xFF111827))
        Spacer(modifier = Modifier.height(12.dp))
        if (loading) {
            Text("Loading...", color = Color(0xFF6B7280))
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(gifts) { gift ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .clickable { Toast.makeText(context, "Open a chat to send ${gift.name}", Toast.LENGTH_SHORT).show() }
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(Color(0xFFFEF3C7)), contentAlignment = Alignment.Center) {
                            Text(text = gift.name.first().toString(), fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = gift.name, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                            Text(text = "💎 ${gift.coinCost}", fontSize = 12.sp, color = Color(0xFF6B7280))
                        }
                        Icon(imageVector = Icons.Filled.CardGiftcard, contentDescription = null, tint = Color(0xFFD97706))
                    }
                }
            }
        }
    }
}
