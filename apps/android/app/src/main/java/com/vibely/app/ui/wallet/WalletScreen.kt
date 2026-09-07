package com.vibely.app.ui.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class DiamondPack(val diamonds: String, val strike: String, val price: String)

@Composable
fun WalletScreen() {
    var recommendTab by remember { mutableStateOf(true) }
    val singlePacks = listOf(
        DiamondPack("18480", "16800", "INR 270.00"),
        DiamondPack("38640", "33600", "INR 540.00"),
        DiamondPack("70000", "56000", "INR 900.00")
    )
    val bundlePacks = listOf(
        DiamondPack("193200", "168000", "INR 2700.00"),
        DiamondPack("386400", "336000", "INR 5400.00"),
        DiamondPack("616000", "560000", "INR 9000.00")
    )

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF7F5FA))) {
        Column(modifier = Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFFB13BF0), Color(0xFF9350F5)))).padding(20.dp)) {
            Text("My Wallet", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Row(modifier = Modifier.padding(top = 24.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Diamond balance: ", color = Color.White, fontSize = 15.sp)
                Text("4625 💎", color = Color.White, fontWeight = FontWeight.Black, fontSize = 24.sp)
            }
        }
        Row(modifier = Modifier.fillMaxWidth().background(Color.White)) {
            Text("Google", color = if (!recommendTab) Color(0xFF9350F5) else Color(0xFFB9AFC2), fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.weight(1f).clickable { recommendTab = false }.background(if (!recommendTab) Color(0xFFEFE3FB) else Color.Transparent).padding(vertical = 18.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Text("Recommend", color = if (recommendTab) Color(0xFF9350F5) else Color(0xFFB9AFC2), fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.weight(1f).clickable { recommendTab = true }.padding(vertical = 18.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        }
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0xFFA855F7)).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Recharge Activity Rewards", color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text("›", color = Color.White, fontSize = 22.sp)
            }
            Row(modifier = Modifier.padding(top = 12.dp).fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("Ride", "180000", "6000", "Headwear", "Ride").forEach { label ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(modifier = Modifier.size(64.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFEFE3FB)))
                        Text(label, fontSize = 11.sp, color = Color(0xFF3C3A3C), modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
            Row(modifier = Modifier.padding(top = 16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("India ▾", color = Color(0xFF3C3A3C), modifier = Modifier.weight(1f).clip(RoundedCornerShape(24.dp)).background(Color.White).padding(horizontal = 16.dp, vertical = 12.dp))
                Text("💳 all wallet", color = Color(0xFFE64545), fontWeight = FontWeight.Bold, modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(Color(0xFFFFE7E7)).padding(horizontal = 16.dp, vertical = 12.dp))
            }
            Text("Weekly Special Offers", color = Color(0xFF19131F), fontWeight = FontWeight.Black, fontSize = 20.sp, modifier = Modifier.padding(top = 22.dp))
            LazyVerticalGrid(columns = GridCells.Fixed(3), modifier = Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(singlePacks + bundlePacks) { pack ->
                    Column(modifier = Modifier.clip(RoundedCornerShape(14.dp)).background(Color.White).padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("💎 ${pack.diamonds}", fontWeight = FontWeight.Black, fontSize = 15.sp, color = Color(0xFF19131F))
                        Text(pack.strike, fontSize = 11.sp, color = Color(0xFFB9AFC2), textDecoration = TextDecoration.LineThrough)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(pack.price, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0xFFE64AA0)).padding(horizontal = 8.dp, vertical = 6.dp))
                    }
                }
            }
        }
    }
}

