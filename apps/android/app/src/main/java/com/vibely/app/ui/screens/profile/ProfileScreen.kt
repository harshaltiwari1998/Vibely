package com.vibely.app.ui.screens.profile

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun ProfileScreen() {
    val container = rememberContainer()
    val vm: ProfileViewModel = viewModel(factory = vmFactory { ProfileViewModel(container.authRepository) })
    val state by vm.state.collectAsState()
    var tempBio by remember { mutableStateOf("") }
    var tempInterests by remember { mutableStateOf("") }
    var tempCountry by remember { mutableStateOf("") }
    var tempLanguage by remember { mutableStateOf("") }
    var tempGender by remember { mutableStateOf("") }

    LaunchedEffect(state.bio) { tempBio = state.bio }
    LaunchedEffect(state.interests) { tempInterests = state.interests.joinToString(", ") }
    LaunchedEffect(state.country) { tempCountry = state.country }
    LaunchedEffect(state.language) { tempLanguage = state.language }
    LaunchedEffect(state.gender) { tempGender = state.gender }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            vm.saveUserFields(
                token = container.sessionPreferences.accessToken.collectAsState(initial = null).value ?: return@rememberLauncherForActivityResult,
                country = tempCountry,
                language = tempLanguage,
                gender = tempGender,
                avatarUrl = uri.toString(),
            )
        }
    }

    fun saveAll() {
        val token = container.sessionPreferences.accessToken.collectAsState(initial = null).value ?: return
        vm.saveProfile(token, tempBio, tempInterests.split(",").map { it.trim() }.filter { it.isNotBlank() })
        vm.saveUserFields(token, tempCountry, tempLanguage, tempGender, state.avatarUrl)
    }

    Screen(title = "My profile") {
        Column(modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(modifier = Modifier.height(16.dp))

            if (state.avatarUrl != null) {
                Image(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Avatar",
                    modifier = Modifier.size(96.dp).clip(MaterialTheme.shapes.medium),
                )
            } else {
                Icon(Icons.Default.Person, contentDescription = "Avatar", modifier = Modifier.size(96.dp))
            }

            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { imagePicker.launch("image/*") }) {
                Text("Change photo")
            }

            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(value = state.username, onValueChange = {}, label = { Text("Username") }, enabled = false, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = state.email, onValueChange = {}, label = { Text("Email") }, enabled = false, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = tempCountry, onValueChange = { tempCountry = it }, label = { Text("Country") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = tempLanguage, onValueChange = { tempLanguage = it }, label = { Text("Language") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = tempGender, onValueChange = { tempGender = it }, label = { Text("Gender") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = tempBio, onValueChange = { tempBio = it }, label = { Text("Bio") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = tempInterests, onValueChange = { tempInterests = it }, label = { Text("Interests (comma separated)") }, modifier = Modifier.fillMaxWidth())

            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { saveAll() }, modifier = Modifier.fillMaxWidth(), enabled = !state.loading) {
                Text("Save profile")
            }

            if (state.error != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
            }
            if (state.success) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Saved", color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}
