package com.vibely.app.ui.vip

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.data.remote.dto.VipStatusResponse
import com.vibely.app.data.remote.dto.VipTierResponse
import com.vibely.app.ui.viewmodel.UiState
import com.vibely.app.ui.viewmodel.VipViewModel

private val tierColors = mapOf(
    "BRONZE" to Color(0xFFB08D57),
    "SILVER" to Color(0xFF9AA3AD),
    "GOLD" to Color(0xFFE6B325),
    "PLATINUM" to Color(0xFF6C5CE7),
)

@Composable
fun VipScreen(viewModel: VipViewModel, onWalletChanged: () -> Unit = {}) {
    val context = LocalContext.current
    val tiersState by viewModel.tiers.collectAsState()
    val statusState by viewModel.status.collectAsState()
    val isPurchasing by viewModel.isPurchasing.collectAsState()
    val message by viewModel.message.collectAsState()

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC)).verticalScroll(rememberScrollState())) {
        Column(
            modifier = Modifier.fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(Color(0xFF141215), Color(0xFF3C3345))))
                .padding(20.dp)
        ) {
            Text("VIP Center", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            val status = (statusState as? UiState.Success)?.data
            Column(modifier = Modifier.padding(top = 20.dp)) {
                if (status?.isActive == true) {
                    Text("${status.level} VIP", color = Color(0xFFE6B325), fontWeight = FontWeight.Black, fontSize = 24.sp)
                    Text("Valid until ${status.expiresAt?.take(10) ?: ""}", color = Color(0xFFB7B2BC), fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
                } else {
                    Text("Not a VIP yet", color = Color.White, fontWeight = FontWeight.Black, fontSize = 24.sp)
                    Text("Purchase a tier below to unlock perks", color = Color(0xFFB7B2BC), fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }
        }

        Column(modifier = Modifier.padding(16.dp)) {
            when (val state = tiersState) {
                is UiState.Loading -> Text("Loading VIP tiers…", color = Color(0xFF6B7280), modifier = Modifier.padding(24.dp))
                is UiState.Error -> Text(state.message, color = Color(0xFFEF4444), modifier = Modifier.padding(24.dp))
                is UiState.Success -> {
                    val currentLevel = (statusState as? UiState.Success)?.data?.takeIf { it.isActive }?.level
                    state.data.forEach { tier ->
                        VipTierCard(
                            tier = tier,
                            isCurrent = tier.level == currentLevel,
                            isPurchasing = isPurchasing,
                            onPurchase = { viewModel.purchase(tier.level, onWalletChanged) }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun VipTierCard(tier: VipTierResponse, isCurrent: Boolean, isPurchasing: Boolean, onPurchase: () -> Unit) {
    val accent = tierColors[tier.level] ?: Color(0xFF9350F5)
    Column(
        modifier = Modifier
            .alpha(if (isPurchasing) 0.6f else 1f)
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .padding(18.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(tier.name, color = accent, fontWeight = FontWeight.Black, fontSize = 20.sp, modifier = Modifier.weight(1f))
            if (isCurrent) {
                Text("ACTIVE", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(accent).padding(horizontal = 10.dp, vertical = 4.dp))
            }
        }
        Text("💎 ${tier.cost} / ${tier.durationDays} days", color = Color(0xFF3C3A3C), fontSize = 14.sp, modifier = Modifier.padding(top = 6.dp))
        Column(modifier = Modifier.padding(top = 10.dp)) {
            tier.perks.forEach { perk ->
                Text("• $perk", color = Color(0xFF6B6570), fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp))
            }
        }
        Text(
            text = if (isCurrent) "Renew" else "Purchase",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 14.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(accent)
                .clickable(enabled = !isPurchasing) { onPurchase() }
                .padding(vertical = 12.dp)
        )
    }
}
