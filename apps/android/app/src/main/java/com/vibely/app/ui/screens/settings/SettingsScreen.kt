package com.vibely.app.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.navigation.rememberContainer
import com.vibely.app.ui.navigation.vmFactory

@Composable
fun SettingsScreen() {
    val container = rememberContainer()
    val vm: SettingsViewModel = viewModel(factory = vmFactory { SettingsViewModel(container.authRepository) })
    val state by vm.state.collectAsState()

    Screen(title = "Settings") {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.padding(top = 8.dp)) {
            item {
                OutlinedTextField(value = state.language, onValueChange = vm::onLanguageChange, label = { Text("Preferred language") }, modifier = Modifier.fillMaxWidth())
            }
            item {
                OutlinedTextField(value = state.gender, onValueChange = vm::onGenderChange, label = { Text("Preferred gender") }, modifier = Modifier.fillMaxWidth())
            }
            item {
                OutlinedTextField(value = state.ageMin, onValueChange = vm::onAgeMinChange, label = { Text("Min age") }, modifier = Modifier.fillMaxWidth())
            }
            item {
                OutlinedTextField(value = state.ageMax, onValueChange = vm::onAgeMaxChange, label = { Text("Max age") }, modifier = Modifier.fillMaxWidth())
            }
            item {
                OutlinedTextField(value = state.countries, onValueChange = vm::onCountriesChange, label = { Text("Preferred countries (comma separated)") }, modifier = Modifier.fillMaxWidth())
            }
            item {
                OutlinedTextField(value = state.languages, onValueChange = vm::onLanguagesChange, label = { Text("Preferred languages (comma separated)") }, modifier = Modifier.fillMaxWidth())
            }
            item {
                Button(onClick = { vm.save() }, modifier = Modifier.fillMaxWidth(), enabled = !state.loading) {
                    Text("Save preferences")
                }
            }
            if (state.error != null) {
                item { Text(state.error ?: "", color = MaterialTheme.colorScheme.error) }
            }
            if (state.success) {
                item { Text("Saved", color = MaterialTheme.colorScheme.primary) }
            }
        }
    }
}
