package com.vibely.app.ui.withdraw

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.dto.WithdrawalResponse
import com.vibely.app.ui.viewmodel.UiState
import com.vibely.app.ui.viewmodel.WithdrawalViewModel

private const val BEANS_PER_INR = 100
private const val MIN_WITHDRAWAL_BEANS = 10000

@Composable
fun WithdrawScreen(api: ApiService, viewModel: WithdrawalViewModel, onBack: () -> Unit = {}) {
    val context = LocalContext.current
    val history by viewModel.history.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val message by viewModel.message.collectAsState()

    var currentBeans by remember { mutableIntStateOf(0) }
    var beansInput by remember { mutableStateOf("") }
    var upiInput by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        try {
            val resp = api.getChatPriceStatus()
            if (resp.success && resp.data != null) currentBeans = resp.data.beans
        } catch (_: Exception) {
        }
    }

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
            if (it.contains("submitted")) {
                beansInput = ""
                upiInput = ""
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
            Text("‹", color = Color(0xFF111827), fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 16.dp).clickable { onBack() })
            Text("Withdraw beans", color = Color(0xFF111827), fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        }

        Column(modifier = Modifier.padding(20.dp)) {
            Column(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color(0xFFFFF7E5)).padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Available balance", color = Color(0xFF9A7B1E), fontSize = 13.sp)
                Text("🫘 $currentBeans", color = Color(0xFF7A5B00), fontWeight = FontWeight.Black, fontSize = 30.sp, modifier = Modifier.padding(top = 4.dp))
                Text("≈ ₹${currentBeans / BEANS_PER_INR}", color = Color(0xFFAD8B2E), fontSize = 13.sp)
            }

            OutlinedTextField(
                value = beansInput,
                onValueChange = { beansInput = it.filter { c -> c.isDigit() } },
                label = { Text("Beans to withdraw (min $MIN_WITHDRAWAL_BEANS)") },
                modifier = Modifier.fillMaxWidth().padding(top = 20.dp)
            )
            OutlinedTextField(
                value = upiInput,
                onValueChange = { upiInput = it },
                label = { Text("UPI ID (e.g. name@bank)") },
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            )
            val beansAmount = beansInput.toIntOrNull() ?: 0
            Text(
                if (beansAmount > 0) "You'll receive ≈ ₹${beansAmount / BEANS_PER_INR}" else "",
                color = Color(0xFF6B7280),
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 6.dp)
            )
            Button(
                onClick = { viewModel.requestWithdrawal(beansAmount, upiInput.trim()) },
                enabled = !isSubmitting && beansAmount >= MIN_WITHDRAWAL_BEANS && beansAmount <= currentBeans && upiInput.contains("@"),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF1470)),
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
            ) {
                Text(if (isSubmitting) "Submitting..." else "Request withdrawal", color = Color.White, fontWeight = FontWeight.Bold)
            }

            Text("History", color = Color(0xFF111827), fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 28.dp))
            when (val s = history) {
                is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280), modifier = Modifier.padding(top = 12.dp))
                is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(top = 12.dp))
                is UiState.Success -> {
                    if (s.data.isEmpty()) {
                        Text("No withdrawal requests yet.", color = Color(0xFF9CA3AF), modifier = Modifier.padding(top = 12.dp))
                    } else {
                        LazyColumn(modifier = Modifier.padding(top = 12.dp)) {
                            items(s.data) { item -> WithdrawalRow(item) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WithdrawalRow(item: WithdrawalResponse) {
    val (label, color) = when (item.status) {
        "PENDING" -> "Pending review" to Color(0xFFF59E0B)
        "APPROVED" -> "Approved" to Color(0xFF3B82F6)
        "PAID" -> "Paid" to Color(0xFF22C55E)
        "REJECTED" -> "Rejected · refunded" to Color(0xFFEF4444)
        else -> item.status to Color(0xFF6B7280)
    }
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text("🫘 ${item.beansAmount} → ₹${item.payoutInr}", fontWeight = FontWeight.Bold, color = Color(0xFF111827))
            Text(item.upiId, fontSize = 12.sp, color = Color(0xFF9CA3AF))
        }
        Text(label, color = color, fontWeight = FontWeight.Bold, fontSize = 12.sp)
    }
}
