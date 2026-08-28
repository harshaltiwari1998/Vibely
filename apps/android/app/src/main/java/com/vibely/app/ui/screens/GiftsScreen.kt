package com.vibely.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
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
import com.vibely.app.ui.screens.gifts.GiftsViewModel

@Composable
fun GiftsScreen() {
    val container = rememberContainer()
    val vm: GiftsViewModel = viewModel(factory = vmFactory { GiftsViewModel(container.context, container.sessionPreferences, container.socketManager, container.apiService) })
    val state by vm.state.collectAsState()
    var selectedGift by remember { mutableStateOf<Map<String, Any>?>(null) }
    var recipientId by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        vm.loadGifts()
        vm.loadHistory()
        vm.loadBalance()
    }

    Screen(title = "Gifts") {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(text = "Balance: ${state.balance} coins", style = MaterialTheme.typography.titleLarge)
                IconButton(onClick = { vm.loadBalance() }) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Gift Catalog", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(modifier = Modifier.weight(1f)) {
                items(state.gifts) { gift ->
                    val giftMap = gift
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(text = "${giftMap["iconUrl"]} ${giftMap["name"]}", style = MaterialTheme.typography.bodyLarge)
                            Text(text = "${giftMap["coinCost"]} coins", style = MaterialTheme.typography.bodyMedium)
                        }
                        Button(onClick = { selectedGift = giftMap }, modifier = Modifier.fillMaxWidth()) {
                            Text("Select")
                        }
                    }
                }
            }

            selectedGift?.let { gift ->
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = recipientId,
                    onValueChange = { recipientId = it },
                    label = { Text("Recipient User ID") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(modifier = Modifier.height(8.dp))
                Button(onClick = {
                    vm.sendGift(recipientId, gift["id"] as String)
                    selectedGift = null
                    recipientId = ""
                }, modifier = Modifier.fillMaxWidth(), enabled = state.balance >= (gift["coinCost"] as Int)) {
                    Text("Send ${gift["name"]} (${gift["coinCost"]} coins)")
                }
            }
        }
    }
}
