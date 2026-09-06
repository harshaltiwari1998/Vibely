package com.vibely.app.ui.history

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.CallViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun HistoryScreen(viewModel: CallViewModel) {
    val state = viewModel.history.collectAsState().value

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC)).padding(16.dp)) {
        Text("Call History", fontWeight = FontWeight.Bold, fontSize = 22.sp, color = Color(0xFF111827))
        Spacer(modifier = Modifier.height(12.dp))
        when (state) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Loading...", color = Color(0xFF6B7280))
                }
            }
            is UiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text((state as UiState.Error).message, color = Color(0xFFEF4444))
                }
            }
            is UiState.Success -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    val logs = (state as UiState.Success<List<com.vibely.app.data.model.CallLog>>).data
                    items(logs) { item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .clickable { }
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.AutoMirrored.Filled.List, contentDescription = null, tint = Color(0xFF7C3AED))
                            Spacer(modifier = Modifier.width(14.dp))
                            Text(text = "${item.userId} · ${item.status.name}", modifier = Modifier.weight(1f), color = Color(0xFF111827))
                            Text(text = "${item.durationSeconds}s", color = Color(0xFF6B7280), fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
