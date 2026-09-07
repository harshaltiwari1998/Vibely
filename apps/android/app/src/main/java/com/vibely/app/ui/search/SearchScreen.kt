package com.vibely.app.ui.search

import androidx.compose.foundation.background
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
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.DiscoverViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun SearchScreen(viewModel: DiscoverViewModel) {
    val state by viewModel.users.collectAsState()
    var query by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Text("Search", color = Color(0xFFFF5B82), fontSize = 32.sp, fontWeight = FontWeight.Black)
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Search by name") },
            modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
            singleLine = true
        )
        val people = (state as? UiState.Success)?.data.orEmpty().filter { it.name.contains(query, ignoreCase = true) }
        LazyColumn(modifier = Modifier.padding(top = 14.dp)) {
            items(people) { user ->
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    androidx.compose.foundation.layout.Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFFECDD3)), contentAlignment = Alignment.Center) {
                        Text(user.name.first().toString(), fontWeight = FontWeight.Bold, color = Color(0xFFBE123C))
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Text(user.name, fontWeight = FontWeight.Bold, color = Color(0xFF1B1720))
                }
            }
        }
    }
}
