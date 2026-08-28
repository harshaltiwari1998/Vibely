package com.vibely.app.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Shared screen scaffold used by every destination. Keeps the architecture
 * consistent without repeating boilerplate in each screen.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Screen(
    title: String,
    showTopBar: Boolean = true,
    content: @Composable () -> Unit,
) {
    Scaffold(
        topBar = {
            if (showTopBar) {
                TopAppBar(title = { Text(title, style = MaterialTheme.typography.titleMedium) })
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
        ) {
            content()
        }
    }
}

@Composable
fun Placeholder(note: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxWidth(),
    ) {
        Text(
            text = note,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
