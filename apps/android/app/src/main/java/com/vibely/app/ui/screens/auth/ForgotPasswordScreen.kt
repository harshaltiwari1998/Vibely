package com.vibely.app.ui.screens.auth

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.Routes
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun ForgotPasswordScreen(nav: NavController) {
    val container = rememberContainer()
    val vm: ForgotPasswordViewModel = viewModel(factory = vmFactory { ForgotPasswordViewModel(container.apiService) })
    val state by vm.state.collectAsState()

    Screen(title = "Reset password") {
        if (state.sent) {
            Text("If the account exists, a reset link has been sent.", color = MaterialTheme.colorScheme.primary)
        } else {
            OutlinedTextField(value = state.email, onValueChange = vm::onEmailChange, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            if (state.error != null) Text(state.error!!, color = MaterialTheme.colorScheme.error)
            Button(onClick = vm::submit, enabled = !state.loading, modifier = Modifier.fillMaxWidth()) { Text("Send reset link") }
        }
        androidx.compose.material3.TextButton(onClick = { nav.navigate(Routes.LOGIN) }) { Text("Back to sign in") }
    }
}
