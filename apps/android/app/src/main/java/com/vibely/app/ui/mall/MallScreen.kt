package com.vibely.app.ui.mall

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.MallViewModel
import com.vibely.app.ui.viewmodel.UiState

private val categories = listOf("HEADWEAR" to "Headwear", "RIDE" to "Ride", "PROFILE_DECORATION" to "Profile decoration")

@Composable
fun MallScreen(viewModel: MallViewModel, onWalletChanged: () -> Unit = {}, onBack: () -> Unit = {}) {
    val context = LocalContext.current
    var showInventory by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf(categories.first().first) }
    val itemsState by viewModel.items.collectAsState()
    val inventoryState by viewModel.inventory.collectAsState()
    val isBusy by viewModel.isBusy.collectAsState()
    val message by viewModel.message.collectAsState()

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    val ownedItemIds = (inventoryState as? UiState.Success)?.data?.map { it.itemId }?.toSet() ?: emptySet()

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
            Text("‹", color = Color(0xFF111827), fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 16.dp).clickable { onBack() })
            Text("Mall", color = Color(0xFF111827), fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            Text(
                if (showInventory) "🛍" else "👜",
                fontSize = 20.sp,
                modifier = Modifier.align(Alignment.CenterEnd).padding(end = 20.dp).clickable { showInventory = !showInventory }
            )
        }

        if (!showInventory) {
            Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC))) {
                categories.forEach { (key, label) ->
                    val selected = selectedCategory == key
                    Text(
                        label,
                        color = if (selected) Color(0xFF9350F5) else Color(0xFFB9AFC2),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier.weight(1f).clickable { selectedCategory = key }.padding(vertical = 14.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }
            when (val s = itemsState) {
                is UiState.Loading -> Text("Loading...", color = Color(0xFF9A9299), modifier = Modifier.padding(24.dp))
                is UiState.Error -> Text(s.message, color = Color(0xFFE64545), modifier = Modifier.padding(24.dp))
                is UiState.Success -> {
                    val filtered = s.data.filter { it.category == selectedCategory }
                    LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(filtered) { item ->
                            val owned = ownedItemIds.contains(item.id)
                            Column(
                                modifier = Modifier.alpha(if (isBusy) 0.6f else 1f).clip(RoundedCornerShape(16.dp)).background(Color(0xFFF8FAFC)).padding(14.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(item.iconUrl, fontSize = 36.sp)
                                Text(item.name, fontWeight = FontWeight.Bold, color = Color(0xFF19131F), fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 6.dp))
                                Text(
                                    if (owned) "Owned" else "💎 ${item.price}",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    modifier = Modifier
                                        .padding(top = 10.dp)
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(if (owned) Color(0xFFB0B0B0) else Color(0xFFE64AA0))
                                        .clickable(enabled = !owned && !isBusy) { viewModel.purchase(item.id, onWalletChanged) }
                                        .padding(horizontal = 16.dp, vertical = 8.dp)
                                )
                            }
                        }
                    }
                }
            }
        } else {
            when (val s = inventoryState) {
                is UiState.Loading -> Text("Loading...", color = Color(0xFF9A9299), modifier = Modifier.padding(24.dp))
                is UiState.Error -> Text(s.message, color = Color(0xFFE64545), modifier = Modifier.padding(24.dp))
                is UiState.Success -> {
                    if (s.data.isEmpty()) {
                        Text("You don't own any items yet.", color = Color(0xFF9A9299), modifier = Modifier.padding(24.dp))
                    } else {
                        LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(s.data) { entry ->
                                Column(
                                    modifier = Modifier.alpha(if (isBusy) 0.6f else 1f).clip(RoundedCornerShape(16.dp)).background(if (entry.equipped) Color(0xFFFEF3C7) else Color(0xFFF8FAFC)).padding(14.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(entry.item.iconUrl, fontSize = 32.sp)
                                    Text(entry.item.name, fontWeight = FontWeight.Bold, color = Color(0xFF19131F), fontSize = 13.sp, textAlign = TextAlign.Center)
                                    Text(
                                        if (entry.equipped) "Equipped" else "Equip",
                                        color = if (entry.equipped) Color(0xFFD97706) else Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        modifier = Modifier
                                            .padding(top = 10.dp)
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(if (entry.equipped) Color(0xFFFFF1AC) else Color(0xFF9350F5))
                                            .clickable(enabled = !isBusy) {
                                                if (entry.equipped) viewModel.unequip(entry.itemId) else viewModel.equip(entry.itemId)
                                            }
                                            .padding(horizontal = 16.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
