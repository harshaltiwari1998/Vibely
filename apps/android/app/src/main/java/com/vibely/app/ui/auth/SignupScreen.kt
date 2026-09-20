package com.vibely.app.ui.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.AuthState
import com.vibely.app.ui.viewmodel.AuthViewModel

@Composable
fun SignupScreen(viewModel: AuthViewModel, onNavigateToLogin: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("India") }
    var referralCode by remember { mutableStateOf("") }
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Create account", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full name") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = referralCode, onValueChange = { referralCode = it }, label = { Text("Invite code (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        if (state is AuthState.Error) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = (state as AuthState.Error).message, color = Color(0xFFEF4444), fontSize = 12.sp)
        }
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = {
                if (name.isBlank() || email.isBlank() || password.isBlank()) {
                    Toast.makeText(context, "All fields are required", Toast.LENGTH_SHORT).show()
                } else if (!email.contains("@")) {
                    Toast.makeText(context, "Enter a valid email", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.register(
                        username = name,
                        email = email,
                        password = password,
                        dateOfBirth = "2000-01-01",
                        gender = "MALE",
                        country = country,
                        language = "en",
                        referralCode = referralCode
                    )
                    Toast.makeText(context, "Account created", Toast.LENGTH_SHORT).show()
                }
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
            enabled = state != AuthState.Loading
        ) {
            if (state == AuthState.Loading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            } else {
                Text("Sign up", fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        Button(
            onClick = onNavigateToLogin,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF7C3AED)),
            enabled = state != AuthState.Loading
        ) {
            Text("Login", fontWeight = FontWeight.Bold)
        }
        if (state == AuthState.Loading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth().height(4.dp))
        }
    }
}
