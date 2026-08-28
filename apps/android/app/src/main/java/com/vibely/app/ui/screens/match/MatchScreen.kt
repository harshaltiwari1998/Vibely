package com.vibely.app.ui.screens.match

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun MatchScreen() {
    val container = rememberContainer()
    val vm: MatchViewModel = viewModel(
        factory = vmFactory {
            MatchViewModel(container.apiService, container.sessionPreferences, container.socketManager)
        }
    )
    val state by vm.state.collectAsState()

    Screen(title = "Find a match") {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            when (state.status) {
                MatchStatus.IDLE -> {
                    Text("Tap to start looking for someone to talk to.", style = MaterialTheme.typography.bodyLarge)
                    Button(onClick = vm::startSearching, modifier = Modifier.fillMaxWidth()) {
                        Text("Start matching")
                    }
                }
                MatchStatus.SEARCHING -> {
                    Text("Searching for a match…", style = MaterialTheme.typography.bodyLarge)
                    Button(onClick = vm::cancel, modifier = Modifier.fillMaxWidth()) {
                        Text("Cancel")
                    }
                }
                MatchStatus.MATCHED -> {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.padding(top = 24.dp))
                    Text("You matched!", style = MaterialTheme.typography.headlineSmall)
                    state.peerName?.let { Text("Peer: $it") }
                    Button(onClick = vm::accept, modifier = Modifier.fillMaxWidth()) {
                        Text("Accept")
                    }
                    Button(onClick = vm::skip, modifier = Modifier.fillMaxWidth()) {
                        Text("Skip")
                    }
                    Button(onClick = vm::decline, modifier = Modifier.fillMaxWidth()) {
                        Text("Decline")
                    }
                }
                MatchStatus.CANCELLED -> {
                    Text("Match cancelled.", style = MaterialTheme.typography.bodyLarge)
                    state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    Button(onClick = vm::startSearching, modifier = Modifier.fillMaxWidth()) {
                        Text("Try again")
                    }
                }
                MatchStatus.EXPIRED -> {
                    Text("Match expired.", style = MaterialTheme.typography.bodyLarge)
                    state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    Button(onClick = vm::startSearching, modifier = Modifier.fillMaxWidth()) {
                        Text("Try again")
                    }
                }
            }
            if (state.error != null && state.status != MatchStatus.CANCELLED && state.status != MatchStatus.EXPIRED) {
                Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
