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
import com.vibely.app.ui.theme.BrandLogo

@Composable
fun LoginScreen(nav: NavController) {
    val container = rememberContainer()
    val vm: LoginViewModel = viewModel(factory = vmFactory { LoginViewModel(container.authRepository) })
    val state by vm.state.collectAsState()

    Screen(title = "Sign in") {
        BrandLogo()
        OutlinedTextField(
            value = state.identifier, onValueChange = vm::onIdentifierChange,
            label = { Text("Email or username") }, modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = state.password, onValueChange = vm::onPasswordChange,
            label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        if (state.error != null) {
            Text(state.error!!, color = MaterialTheme.colorScheme.error)
        }
        Button(onClick = vm::login, enabled = !state.loading, modifier = Modifier.fillMaxWidth()) {
            Text("Sign in")
        }
        TextButton(onClick = { nav.navigate(Routes.REGISTER) }) { Text("Create account") }
        TextButton(onClick = { nav.navigate(Routes.FORGOT_PASSWORD) }) { Text("Forgot password?") }

        if (state.success) {
            LaunchedEffect(Unit) {
                nav.navigate(Routes.HOME) { popUpTo(Routes.LOGIN) { inclusive = true } }
            }
        }
    }
}
