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
import com.vibely.app.ui.screens.wallet.WalletViewModel

@Composable
fun WalletScreen() {
    val container = rememberContainer()
    val vm: WalletViewModel = viewModel(factory = vmFactory { WalletViewModel(container.context, container.sessionPreferences, container.apiService) })
    val state by vm.state.collectAsState()
    var refreshing by remember { mutableStateOf(false) }
    var selectedPackage by remember { mutableStateOf<Map<String, Any>?>(null) }

    LaunchedEffect(Unit) {
        vm.loadBalance()
        vm.loadTransactions()
        vm.loadPackages()
    }

    Screen(title = "Wallet") {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Box(
                modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.primaryContainer).padding(24.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Coin Balance", style = MaterialTheme.typography.titleMedium)
                    Text(text = "${state.balance}", style = MaterialTheme.typography.headlineLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    IconButton(onClick = { refreshing = true; vm.loadBalance(); vm.loadTransactions(); refreshing = false }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Buy Coins", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(modifier = Modifier.weight(1f)) {
                items(state.packages) { pkg ->
                    val pkgMap = pkg
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(text = "${pkgMap["coins"]} coins", style = MaterialTheme.typography.bodyLarge)
                            Text(text = "₹${pkgMap["price"]} ${pkgMap["currency"]}", style = MaterialTheme.typography.bodyMedium)
                        }
                        Button(onClick = { selectedPackage = pkgMap }, modifier = Modifier.fillMaxWidth()) {
                            Text("Buy")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Transactions", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(modifier = Modifier.weight(1f)) {
                items(state.transactions) { tx ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column {
                            Text(text = tx.type.replace(Regex("_(.)"), { it.groupValues[1].uppercase() }), style = MaterialTheme.typography.bodyMedium)
                            Text(text = tx.createdAt, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                        Text(
                            text = "${if (tx.amount >= 0) "+" else ""}${tx.amount}",
                            color = if (tx.amount >= 0) Color.Green else Color.Red,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }
    }
}
