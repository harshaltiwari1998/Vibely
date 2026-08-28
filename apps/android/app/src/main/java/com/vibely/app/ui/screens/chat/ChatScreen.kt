package com.vibely.app.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun ChatScreen() {
    val container = rememberContainer()
    val vm: ChatViewModel = viewModel(factory = vmFactory { ChatViewModel(container.context, container.sessionPreferences, container.socketManager, container.apiService) })
    val state by vm.state.collectAsState()
    var draft by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.size - 1)
        }
    }

    LaunchedEffect(state.translationMode, state.targetLanguage) {
        if (state.translationMode != "original") {
            state.messages.forEach { msg ->
                if (!state.translations.containsKey(msg.id)) {
                    vm.translateMessage(msg.id, msg.text)
                }
            }
        }
    }

    Screen(title = "Chat", showTopBar = false) {
        if (state.conversations.isEmpty() && state.activeChatId == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No conversations yet.")
            }
            return@Screen
        }

        Column(modifier = Modifier.fillMaxSize()) {
            if (state.activeChatId != null) {
                Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = state.conversations.find { it.id == state.activeChatId }?.peerName ?: "Chat",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.weight(1f),
                    )
                    Button(onClick = { vm.openChat("") }) { Text("Back") }
                }
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    state = listState,
                ) {
                    item {
                        Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "Translation:", modifier = Modifier.padding(end = 8.dp))
                            Button(onClick = { vm.setTranslationMode("original") }, enabled = state.translationMode != "original") { Text("Original") }
                            Spacer(modifier = Modifier.width(4.dp))
                            Button(onClick = { vm.setTranslationMode("translated") }, enabled = state.translationMode != "translated") { Text("Translated") }
                            Spacer(modifier = Modifier.width(4.dp))
                            Button(onClick = { vm.setTranslationMode("both") }, enabled = state.translationMode != "both") { Text("Both") }
                        }
                    }
                    items(state.messages) { msg ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            contentAlignment = if (msg.fromMe) Alignment.CenterEnd else Alignment.CenterStart,
                        ) {
                            Column(
                                modifier = Modifier
                                    .background(if (msg.fromMe) Color(0xFFDCF8C6) else Color(0xFFE5E5EA))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                            ) {
                                if (state.translationMode == "original" || state.translationMode == "both") {
                                    Text(text = msg.text, color = Color.Black)
                                }
                                if (state.translationMode == "translated" || state.translationMode == "both") {
                                    val translated = state.translations[msg.id]
                                    if (translated != null) {
                                        Text(text = translated, color = Color.Gray, style = MaterialTheme.typography.bodySmall)
                                    } else {
                                        Text(text = "Translating...", color = Color.LightGray, style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                                Text(text = msg.createdAt, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                            }
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = draft,
                        onValueChange = { draft = it },
                        modifier = Modifier.weight(1f),
                        label = { Text("Message") },
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(onClick = {
                        vm.send(draft)
                        draft = ""
                    }) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = "Send")
                    }
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(state.conversations) { conv ->
                        Button(
                            onClick = { vm.openChat(conv.id) },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(text = conv.peerName, modifier = Modifier.fillMaxWidth())
                                conv.lastMessage?.let { Text(text = it, modifier = Modifier.fillMaxWidth()) }
                            }
                        }
                    }
                }
            }
        }
    }
}
