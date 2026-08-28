package com.vibely.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vibely.app.ui.components.Screen

@Composable
fun HomeScreen() {
    Screen(title = "Home") {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Card(Modifier.weight(1f)) { Text("Start a match", Modifier.fillMaxWidth()) }
            Card(Modifier.weight(1f)) { Text("Discover", Modifier.fillMaxWidth()) }
        }
        Text("Dashboard aggregation (matches, coins, notifications) lands in Part 2.", style = MaterialTheme.typography.bodyLarge)
    }
}
