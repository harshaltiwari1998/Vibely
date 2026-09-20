package com.vibely.app.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
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
import com.vibely.app.data.remote.dto.SearchUserResponse
import com.vibely.app.ui.viewmodel.SearchFilters
import com.vibely.app.ui.viewmodel.SearchViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun SearchScreen(viewModel: SearchViewModel) {
    val query by viewModel.query.collectAsState()
    val filters by viewModel.filters.collectAsState()
    val state by viewModel.results.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Text("Search", color = Color(0xFFFF5B82), fontSize = 32.sp, fontWeight = FontWeight.Black)
        OutlinedTextField(
            value = query,
            onValueChange = { viewModel.setQuery(it) },
            placeholder = { Text("Search by username") },
            modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
            singleLine = true
        )

        Row(modifier = Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip("All", filters.gender == null) { viewModel.setFilters(filters.copy(gender = null)) }
            FilterChip("Male", filters.gender == "MALE") { viewModel.setFilters(filters.copy(gender = "MALE")) }
            FilterChip("Female", filters.gender == "FEMALE") { viewModel.setFilters(filters.copy(gender = "FEMALE")) }
            FilterChip("Online only", filters.onlineOnly) { viewModel.setFilters(filters.copy(onlineOnly = !filters.onlineOnly)) }
        }

        when (val s = state) {
            is UiState.Loading -> Text("Searching...", color = Color(0xFF6B7280), modifier = Modifier.padding(top = 20.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(top = 20.dp))
            is UiState.Success -> {
                if (s.data.isEmpty() && query.isNotBlank()) {
                    Text("No one found.", color = Color(0xFF9CA3AF), modifier = Modifier.padding(top = 20.dp))
                } else {
                    LazyColumn(modifier = Modifier.padding(top = 14.dp)) {
                        items(s.data) { user -> SearchResultRow(user) }
                    }
                }
            }
        }
    }
}

@Composable
private fun FilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        color = if (selected) Color.White else Color(0xFF888188),
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (selected) Color(0xFFBD32E8) else Color(0xFFF0EFF0))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp)
    )
}

@Composable
private fun SearchResultRow(user: SearchUserResponse) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFFECDD3)), contentAlignment = Alignment.Center) {
            Text(user.username.firstOrNull()?.uppercase() ?: "?", fontWeight = FontWeight.Bold, color = Color(0xFFBE123C))
        }
        Spacer(modifier = Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(user.username, fontWeight = FontWeight.Bold, color = Color(0xFF1B1720))
            Text(user.country ?: "", fontSize = 12.sp, color = Color(0xFF9CA3AF))
        }
        if (user.profile?.onlineStatus == "ONLINE") {
            Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(Color(0xFF22C55E)))
        }
    }
}
