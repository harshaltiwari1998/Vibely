package com.vibely.app.ui.screens.auth

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.Routes
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun RegisterScreen(nav: NavController) {
    val container = rememberContainer()
    val vm: RegisterViewModel = viewModel(factory = vmFactory { RegisterViewModel(container.authRepository) })
    val s by vm.state.collectAsState()

    Screen(title = "Create account") {
        OutlinedTextField(value = s.username, onValueChange = { vm.update { copy(username = it) } }, label = { Text("Username") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = s.email, onValueChange = { vm.update { copy(email = it) } }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = s.password, onValueChange = { vm.update { copy(password = it) } }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = s.dateOfBirth, onValueChange = { vm.update { copy(dateOfBirth = it) } }, label = { Text("Date of birth") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = s.country, onValueChange = { vm.update { copy(country = it) } }, label = { Text("Country") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = s.language, onValueChange = { vm.update { copy(language = it) } }, label = { Text("Language") }, modifier = Modifier.fillMaxWidth())
        if (s.error != null) { Text(s.error ?: "", color = MaterialTheme.colorScheme.error) }
        Button(onClick = vm::register, enabled = !s.loading, modifier = Modifier.fillMaxWidth()) { Text("Create account") }
        TextButton(onClick = { nav.navigate(Routes.LOGIN) }) { Text("Already have an account?") }

        if (s.success) {
            LaunchedEffect(Unit) { nav.navigate(Routes.LOGIN) { popUpTo(Routes.REGISTER) { inclusive = true } } }
        }
    }
}
