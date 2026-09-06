package com.vibely.app.ui.profile

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ProfileScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(CircleShape)
                .background(Color(0xFFDDD6FE)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.AccountCircle,
                contentDescription = null,
                modifier = Modifier.size(70.dp),
                tint = Color(0xFF7C3AED)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("User Name", fontWeight = FontWeight.Bold, fontSize = 22.sp, color = Color(0xFF111827))
        Spacer(modifier = Modifier.height(8.dp))
        Text("Online", color = Color(0xFF10B981), fontSize = 14.sp)
        Spacer(modifier = Modifier.height(20.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(16.dp)).background(Color.White).clickable { }.padding(16.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Icon(imageVector = Icons.Filled.Edit, contentDescription = null, tint = Color(0xFF7C3AED))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Edit", color = Color(0xFF111827), fontWeight = FontWeight.Bold)
                }
            }
            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(16.dp)).background(Color.White).clickable { }.padding(16.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Icon(imageVector = Icons.Default.AccountCircle, contentDescription = null, tint = Color(0xFF7C3AED))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("View", color = Color(0xFF111827), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
