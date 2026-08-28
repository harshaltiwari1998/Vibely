package com.vibely.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.vmFactory
import com.vibely.app.ui.screens.history.HistoryViewModel

@Composable
fun HistoryScreen() {
    val vm: HistoryViewModel = viewModel(factory = vmFactory { HistoryViewModel() })
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) {
        vm.loadHistory()
    }

    Screen(title = "Call History") {
        if (state.calls.isEmpty()) {
            Text("No calls yet.", modifier = Modifier.fillMaxSize(), style = MaterialTheme.typography.bodyLarge)
            return@Screen
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(state.calls) { call ->
                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Text(text = "${call.initiatorUsername} → ${call.receiverUsername}", style = MaterialTheme.typography.bodyLarge)
                    Text(text = "${call.startedAt} · Duration: ${call.durationSeconds}s · ${call.status}", style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { /* call again */ }) { Text("Call Again") }
                        Button(onClick = { /* favorite */ }) { Text("Favorite") }
                        Button(onClick = { /* block */ }) { Text("Block") }
                        Button(onClick = { /* report */ }) { Text("Report") }
                    }
                }
            }
        }
    }
}
