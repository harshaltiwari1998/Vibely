package com.vibely.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navArgument
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.remote.ApiService
import com.vibely.app.ui.auth.LoginScreen
import com.vibely.app.ui.auth.SignupScreen
import com.vibely.app.ui.viewmodel.AuthState
import com.vibely.app.ui.viewmodel.AuthViewModel

@Composable
fun VibelyNavGraph(navController: NavHostController, authViewModel: AuthViewModel, api: ApiService, tokenManager: TokenManager) {
    val authState by authViewModel.state.collectAsState()

    // Login and Signup are separate destinations, but a successful auth on
    // either one must navigate to "main" — watching this at the graph level
    // (rather than inside just the "auth" route) means it fires no matter
    // which of the two screens the user is currently on.
    LaunchedEffect(authState) {
        if (authState is AuthState.Success && navController.currentDestination?.route != "main") {
            navController.navigate("main") {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    NavHost(navController = navController, startDestination = "auth") {
        composable("auth") {
            LoginScreen(
                viewModel = authViewModel,
                onNavigateToSignup = { navController.navigate("signup") }
            )
        }
        composable("signup") {
            SignupScreen(
                viewModel = authViewModel,
                onNavigateToLogin = { navController.popBackStack() }
            )
        }
        composable("main") {
            MainScreen(
                api = api,
                token = tokenManager.getAccessToken(),
                userId = tokenManager.getUserId(),
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("auth") {
                        popUpTo("main") { inclusive = true }
                    }
                }
            )
        }
    }
}
