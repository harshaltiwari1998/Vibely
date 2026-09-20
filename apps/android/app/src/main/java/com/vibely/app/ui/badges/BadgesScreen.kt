package com.vibely.app.ui.badges

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.vibely.app.ui.viewmodel.BadgesViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun BadgesScreen(viewModel: BadgesViewModel, onBack: () -> Unit = {}) {
    val context = LocalContext.current
    val state by viewModel.badges.collectAsState()
    val featuredId by viewModel.featuredBadgeId.collectAsState()
    val message by viewModel.message.collectAsState()

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(
            modifier = Modifier.fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(Color(0xFF9350F5), Color(0xFFB040E8))))
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("‹", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { onBack() })
                Text("My Badge", color = Color.White, fontWeight = FontWeight.Medium, fontSize = 22.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                Box(modifier = Modifier.size(28.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.2f)), contentAlignment = Alignment.Center) {
                    Text("?", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
            val earnedBadges = (state as? UiState.Success)?.data?.filter { it.earned }.orEmpty()
            Row(modifier = Modifier.fillMaxWidth().padding(top = 18.dp), verticalAlignment = Alignment.CenterVertically) {
                Row(modifier = Modifier.weight(1f)) {
                    earnedBadges.take(3).forEach { badge ->
                        Box(
                            modifier = Modifier.size(48.dp).padding(end = 4.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) { Text(badge.icon, fontSize = 20.sp) }
                    }
                }
                Text(
                    "Featured: ${earnedBadges.firstOrNull { it.id == featuredId }?.name ?: "None"}",
                    color = Color(0xFFB040E8),
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    modifier = Modifier.clip(RoundedCornerShape(24.dp)).background(Color.White).padding(horizontal = 16.dp, vertical = 10.dp)
                )
            }
        }

        when (val s = state) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF6B7280), modifier = Modifier.padding(24.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFEF4444), modifier = Modifier.padding(24.dp))
            is UiState.Success -> {
                if (s.data.none { it.earned }) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(top = 80.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🏅", fontSize = 40.sp, modifier = Modifier.alpha(0.3f))
                        Text("have not yet received a badge", color = Color(0xFF9CA3AF), modifier = Modifier.padding(top = 12.dp))
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(s.data) { badge ->
                            val isFeatured = badge.id == featuredId
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .alpha(if (badge.earned) 1f else 0.35f)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(if (isFeatured) Color(0xFFFEF3C7) else Color.White)
                                    .clickable(enabled = badge.earned) { viewModel.setFeatured(badge.id) }
                                    .padding(vertical = 16.dp, horizontal = 8.dp)
                            ) {
                                Text(badge.icon, fontSize = 30.sp)
                                Text(badge.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827), textAlign = TextAlign.Center)
                                Text(badge.description, fontSize = 10.sp, color = Color(0xFF9CA3AF), textAlign = TextAlign.Center)
                                if (isFeatured) {
                                    Text("WEARING", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
