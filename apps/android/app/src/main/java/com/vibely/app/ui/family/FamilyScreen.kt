package com.vibely.app.ui.family

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.FamilyViewModel
import com.vibely.app.ui.viewmodel.UiState

@Composable
fun FamilyScreen(viewModel: FamilyViewModel, myUserId: String?) {
    val context = LocalContext.current
    val myFamilyState by viewModel.myFamily.collectAsState()
    val message by viewModel.message.collectAsState()

    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.consumeMessage()
        }
    }

    when (val s = myFamilyState) {
        is UiState.Loading -> Text("Loading...", color = Color(0xFF9A9299), modifier = Modifier.padding(24.dp))
        is UiState.Error -> Text(s.message, color = Color(0xFFE64545), modifier = Modifier.padding(24.dp))
        is UiState.Success -> {
            val family = s.data
            if (family == null) {
                NoFamilyView(viewModel = viewModel)
            } else {
                FamilyDetailView(viewModel = viewModel, family = family, isOwner = family.owner.id == myUserId)
            }
        }
    }
}

@Composable
private fun NoFamilyView(viewModel: FamilyViewModel) {
    var name by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var search by remember { mutableStateOf("") }
    val browseState by viewModel.browseList.collectAsState()
    val isBusy by viewModel.isBusy.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF7F5FA))) {
        Column(modifier = Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFFFF9A3C), Color(0xFFFF5C7C)))).padding(24.dp)) {
            Text("Family", color = Color.White, fontWeight = FontWeight.Black, fontSize = 28.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            Text("You're not in a family yet.", color = Color.White.copy(alpha = 0.9f), fontSize = 13.sp, modifier = Modifier.fillMaxWidth().padding(top = 6.dp), textAlign = TextAlign.Center)
        }
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Create a family", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF19131F))
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Family name") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp), singleLine = true)
            OutlinedTextField(value = bio, onValueChange = { bio = it }, label = { Text("Bio (optional)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp), singleLine = true)
            Button(
                onClick = { viewModel.create(name, bio.takeIf { it.isNotBlank() }) },
                enabled = !isBusy && name.trim().length >= 2,
                modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF5C7C))
            ) { Text("Create") }

            Text("Or join one", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF19131F), modifier = Modifier.padding(top = 24.dp))
            OutlinedTextField(
                value = search,
                onValueChange = { search = it; viewModel.browse(it.takeIf { q -> q.isNotBlank() }) },
                label = { Text("Search families") },
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                singleLine = true
            )
        }
        when (val s = browseState) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF9A9299), modifier = Modifier.padding(horizontal = 16.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFE64545), modifier = Modifier.padding(horizontal = 16.dp))
            is UiState.Success -> {
                LazyColumn(modifier = Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(s.data) { fam ->
                        Row(
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color.White).padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(fam.name, fontWeight = FontWeight.Bold, color = Color(0xFF19131F))
                                Text("${fam.memberCount} members · owned by ${fam.ownerUsername}", fontSize = 12.sp, color = Color(0xFF9A9299))
                            }
                            Text(
                                "Join",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFFFF5C7C))
                                    .clickable(enabled = !isBusy) { viewModel.join(fam.id) }
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FamilyDetailView(viewModel: FamilyViewModel, family: com.vibely.app.data.remote.dto.FamilyDetailResponse, isOwner: Boolean) {
    val leaderboardState by viewModel.leaderboard.collectAsState()
    val isBusy by viewModel.isBusy.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF7F5FA))) {
        Column(modifier = Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFFFF9A3C), Color(0xFFFF5C7C)))).padding(24.dp)) {
            Text(family.name, color = Color.White, fontWeight = FontWeight.Black, fontSize = 28.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            family.bio?.let { Text(it, color = Color.White.copy(alpha = 0.9f), fontSize = 13.sp, modifier = Modifier.fillMaxWidth().padding(top = 6.dp), textAlign = TextAlign.Center) }
            Text("${family.members.size} members · owner ${family.owner.username}", color = Color.White.copy(alpha = 0.85f), fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(top = 8.dp), textAlign = TextAlign.Center)
        }
        Button(
            onClick = { if (isOwner) viewModel.disband() else viewModel.leave() },
            enabled = !isBusy,
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE64545))
        ) { Text(if (isOwner) "Disband family" else "Leave family") }

        Text("Gift leaderboard", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF19131F), modifier = Modifier.padding(horizontal = 16.dp))
        when (val s = leaderboardState) {
            is UiState.Loading -> Text("Loading...", color = Color(0xFF9A9299), modifier = Modifier.padding(16.dp))
            is UiState.Error -> Text(s.message, color = Color(0xFFE64545), modifier = Modifier.padding(16.dp))
            is UiState.Success -> {
                LazyColumn(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(s.data) { entry ->
                        Row(
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color.White).padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color(0xFFFFE3E9)), contentAlignment = Alignment.Center) {
                                Text(entry.username.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFFE64545), fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(entry.username, fontWeight = FontWeight.Bold, color = Color(0xFF19131F), modifier = Modifier.weight(1f))
                            Text("💎 ${entry.totalGiftsSent}", color = Color(0xFFD31CE5), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}
