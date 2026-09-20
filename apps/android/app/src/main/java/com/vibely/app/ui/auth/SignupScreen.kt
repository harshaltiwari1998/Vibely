package com.vibely.app.ui.auth

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vibely.app.ui.viewmodel.AuthState
import com.vibely.app.ui.viewmodel.AuthViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

private val COUNTRIES = listOf("India", "United States", "United Kingdom", "Canada", "Australia", "United Arab Emirates", "Pakistan", "Bangladesh", "Nigeria", "Other")
private data class GenderOption(val label: String, val value: String)
private val GENDER_OPTIONS = listOf(GenderOption("Male", "MALE"), GenderOption("Female", "FEMALE"), GenderOption("Other", "OTHER"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignupScreen(viewModel: AuthViewModel, onNavigateToLogin: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("India") }
    var countryMenuExpanded by remember { mutableStateOf(false) }
    var gender by remember { mutableStateOf<GenderOption?>(null) }
    var dobMillis by remember { mutableStateOf<Long?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }
    var referralCode by remember { mutableStateOf("") }
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    val calendar = remember { Calendar.getInstance() }
    val maxDobMillis = remember { calendar.clone().let { (it as Calendar).apply { add(Calendar.YEAR, -18) }.timeInMillis } }
    val minDobMillis = remember { calendar.clone().let { (it as Calendar).apply { add(Calendar.YEAR, -120) }.timeInMillis } }
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy", Locale.US) }
    val isoFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AuthGradient)
            .padding(horizontal = 24.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Create account", fontSize = 30.sp, fontWeight = FontWeight.Black, color = Color.White)
        Spacer(modifier = Modifier.height(6.dp))
        Text("Join Jholamet and start connecting", color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
        Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .padding(20.dp)
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full name") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp), colors = authFieldColors())
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp), colors = authFieldColors())
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp), colors = authFieldColors())

            Spacer(modifier = Modifier.height(16.dp))
            Text("I am", color = Color(0xFF6B7280), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GENDER_OPTIONS.forEach { option ->
                    val selected = gender == option
                    Text(
                        option.label,
                        color = if (selected) Color.White else Color(0xFF6B7280),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (selected) Color(0xFFC116FF) else Color(0xFFF3F4F6))
                            .clickable { gender = option }
                            .padding(horizontal = 18.dp, vertical = 10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = dobMillis?.let { dateFormat.format(it) } ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Date of birth") },
                placeholder = { Text("Tap to select") },
                trailingIcon = { Icon(Icons.Filled.DateRange, contentDescription = null, tint = Color(0xFF9CA3AF)) },
                modifier = Modifier.fillMaxWidth().clickable { showDatePicker = true },
                enabled = false,
                shape = RoundedCornerShape(14.dp),
                colors = authFieldColors()
            )

            Spacer(modifier = Modifier.height(12.dp))
            Box {
                OutlinedTextField(
                    value = country,
                    onValueChange = {},
                    readOnly = true,
                    enabled = false,
                    label = { Text("Country") },
                    trailingIcon = { Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = Color(0xFF9CA3AF)) },
                    modifier = Modifier.fillMaxWidth().clickable { countryMenuExpanded = true },
                    shape = RoundedCornerShape(14.dp),
                    colors = authFieldColors()
                )
                DropdownMenu(expanded = countryMenuExpanded, onDismissRequest = { countryMenuExpanded = false }) {
                    COUNTRIES.forEach { c ->
                        DropdownMenuItem(text = { Text(c) }, onClick = { country = c; countryMenuExpanded = false })
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(value = referralCode, onValueChange = { referralCode = it }, label = { Text("Invite code (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp), colors = authFieldColors())

            if (state is AuthState.Error) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = (state as AuthState.Error).message,
                    color = Color(0xFFB91C1C),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(Color(0xFFFEE2E2)).padding(horizontal = 12.dp, vertical = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = {
                    when {
                        name.isBlank() || email.isBlank() || password.isBlank() -> Toast.makeText(context, "All fields are required", Toast.LENGTH_SHORT).show()
                        !email.contains("@") -> Toast.makeText(context, "Enter a valid email", Toast.LENGTH_SHORT).show()
                        gender == null -> Toast.makeText(context, "Please select your gender", Toast.LENGTH_SHORT).show()
                        dobMillis == null -> Toast.makeText(context, "Please select your date of birth", Toast.LENGTH_SHORT).show()
                        else -> {
                            viewModel.register(
                                username = name,
                                email = email,
                                password = password,
                                dateOfBirth = isoFormat.format(dobMillis!!),
                                gender = gender!!.value,
                                country = country,
                                language = "en",
                                referralCode = referralCode
                            )
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .clip(RoundedCornerShape(27.dp))
                    .background(if (state == AuthState.Loading) Brush.horizontalGradient(listOf(Color(0xFFB9B9B9), Color(0xFFB9B9B9))) else CtaGradient),
                shape = RoundedCornerShape(27.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                elevation = null,
                enabled = state != AuthState.Loading
            ) {
                if (state == AuthState.Loading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.5.dp)
                } else {
                    Text("Create account", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Already have an account? ", color = Color.White.copy(alpha = 0.85f), fontSize = 14.sp)
            Text(
                "Log in",
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 14.sp,
                modifier = Modifier.clickable(enabled = state != AuthState.Loading) { onNavigateToLogin() }
            )
        }
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = dobMillis ?: maxDobMillis,
            selectableDates = object : androidx.compose.material3.SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long): Boolean = utcTimeMillis in minDobMillis..maxDobMillis
            }
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    dobMillis = datePickerState.selectedDateMillis
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}
