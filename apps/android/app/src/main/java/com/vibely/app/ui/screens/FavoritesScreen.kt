package com.vibely.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
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
fun FavoritesScreen() {
    val container = rememberContainer()
    val vm: FavoritesViewModel = viewModel(factory = vmFactory { FavoritesViewModel(container.authRepository) })
    val items by vm.items.collectAsState()

    Screen(title = "Favorites") {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(items) { fav ->
                Column(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
                    Text(fav.targetUser?.username ?: "Unknown", style = MaterialTheme.typography.titleMedium)
                    Text(fav.targetUser?.country ?: "", style = MaterialTheme.typography.bodySmall)
                    IconButton(onClick = { vm.unfavorite(fav.targetUserId) }) {
                        Icon(Icons.Default.Favorite, contentDescription = "Unfavorite")
                    }
                }
            }
        }
    }
}
