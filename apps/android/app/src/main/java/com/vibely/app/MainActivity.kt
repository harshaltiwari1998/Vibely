package com.vibely.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.compose.rememberNavController
import com.vibely.app.ui.navigation.VibelyNavGraph
import com.vibely.app.ui.viewmodel.AuthViewModel
import com.vibely.app.ui.viewmodel.AuthState

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_Vibely)
        super.onCreate(savedInstanceState)
        setContent {
            val navController = rememberNavController()
            val authViewModel = AuthViewModel()
            Surface(modifier = Modifier.fillMaxSize()) {
                VibelyNavGraph(navController = navController, authViewModel = authViewModel)
            }
        }
    }
}
