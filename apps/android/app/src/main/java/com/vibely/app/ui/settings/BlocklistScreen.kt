package com.vibely.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.BlocklistViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun BlocklistScreen(viewModel: BlocklistViewModel) {
    val state by viewModel.blocked.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Text(
            text = "Personal blacklist",
            fontWeight = FontWeight.Medium,
            fontSize = 24.sp,
            modifier = Modifier.fillMaxWidth().padding(24.dp),
            color = Color(0xFF111827)
        )
        when (val s = state) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280), modifier = Modifier.padding(horizontal = 24.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(horizontal = 24.dp))
            is UiState.Success -> {
                if (s.data.isEmpty()) {
                    Text("You haven't blocked anyone.", color = Color(0xFF9CA3AF), modifier = Modifier.padding(horizontal = 24.dp))
                } else {
                    LazyColumn(modifier = Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(s.data) { entry ->
                            Row(
                                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color.White).padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFFE5E7EB)), contentAlignment = Alignment.Center) {
                                    Text(entry.blocked.username.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF6B7280))
                                }
                                Text(entry.blocked.username, color = Color(0xFF111827), fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f).padding(start = 12.dp))
                                Text(
                                    "Unblock",
                                    color = Color(0xFF7C3AED),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(Color(0xFFF3EBFF))
                                        .clickable { viewModel.unblock(entry.blocked.id) }
                                        .padding(horizontal = 14.dp, vertical = 8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
