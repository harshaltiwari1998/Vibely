package com.vibely.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun DiscoverScreen() {
    val container = rememberContainer()
    val vm: DiscoverViewModel = viewModel(factory = vmFactory { DiscoverViewModel(container.authRepository) })
    val items by vm.items.collectAsState()

    Screen(title = "Discover") {
        Button(onClick = { vm.load() }, modifier = Modifier.fillMaxWidth()) { Text("Refresh") }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
            items(items) { profile ->
                Column(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
                    Text(profile.username, style = MaterialTheme.typography.titleMedium)
                    Text("${profile.country} • ${profile.language}", style = MaterialTheme.typography.bodySmall)
                    Text(profile.bio ?: "", style = MaterialTheme.typography.bodySmall)
                    if (!profile.onlineStatus.isNullOrBlank()) {
                        Text("Status: ${profile.onlineStatus}", style = MaterialTheme.typography.bodySmall)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        val isFav = profile.isFavorite
                        IconButton(onClick = { vm.toggleFavorite(profile.id) }) {
                            Icon(
                                imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = "Favorite",
                            )
                        }
                    }
                }
            }
        }
    }
}
