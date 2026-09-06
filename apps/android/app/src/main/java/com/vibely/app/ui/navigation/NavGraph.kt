package com.vibely.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.vibely.app.ui.auth.LoginScreen
import com.vibely.app.ui.auth.OtpScreen
import com.vibely.app.ui.auth.SignupScreen
import com.vibely.app.ui.call.CallScreen
import com.vibely.app.ui.chat.ChatScreen
import com.vibely.app.ui.discover.DiscoverScreen
import com.vibely.app.ui.gifts.GiftsScreen
import com.vibely.app.ui.history.HistoryScreen
import com.vibely.app.ui.home.HomeScreen
import com.vibely.app.ui.match.MatchScreen
import com.vibely.app.ui.notifications.NotificationsScreen
import com.vibely.app.ui.profile.ProfileScreen
import com.vibely.app.ui.settings.SettingsScreen
import com.vibely.app.ui.viewmodel.AuthViewModel
import com.vibely.app.ui.viewmodel.CallViewModel
import com.vibely.app.ui.viewmodel.ChatViewModel
import com.vibely.app.ui.viewmodel.DiscoverViewModel
import com.vibely.app.ui.viewmodel.HomeViewModel
import com.vibely.app.ui.viewmodel.MatchViewModel

@Composable
fun VibelyNavGraph(navController: NavHostController, authViewModel: AuthViewModel) {
    NavHost(navController = navController, startDestination = Screen.Auth.route) {
        composable(Screen.Auth.route) {
            if (authViewModel.state.value is com.vibely.app.ui.viewmodel.AuthState.Success) {
                navController.navigate(Screen.Main.route) {
                    popUpTo(Screen.Auth.route) { inclusive = true }
                }
            } else {
                LoginScreen(
                    onNavigateToSignup = { navController.navigate(Screen.Signup.route) },
                    onLoginSuccess = {
                        authViewModel.sendOtp()
                        navController.navigate(Screen.Otp.createRoute("user"))
                    }
                )
            }
        }
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToSignup = { navController.navigate(Screen.Signup.route) },
                onLoginSuccess = {
                    authViewModel.sendOtp()
                    navController.navigate(Screen.Otp.createRoute("user"))
                }
            )
        }
        composable(Screen.Signup.route) {
            SignupScreen(onSignupSuccess = { navController.popBackStack() })
        }
        composable(
            Screen.Otp.route,
            arguments = listOf(navArgument("phone") { type = NavType.StringType })
        ) { backStackEntry ->
            val phone = backStackEntry.arguments?.getString("phone") ?: ""
            OtpScreen(
                phone = phone,
                onOtpSuccess = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Auth.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Main.route) {
            MainScreen(navController = navController)
        }
        composable(Screen.Home.route) {
            HomeScreen(viewModel = HomeViewModel())
        }
        composable(Screen.Discover.route) {
            DiscoverScreen(viewModel = DiscoverViewModel())
        }
        composable(Screen.Match.route) {
            MatchScreen(viewModel = MatchViewModel())
        }
        composable(Screen.Call.route) {
            CallScreen(viewModel = CallViewModel())
        }
        composable(
            Screen.Chat.route,
            arguments = listOf(navArgument("userId") { type = NavType.StringType })
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: ""
            ChatScreen(userId = userId, viewModel = ChatViewModel())
        }
        composable(Screen.Wallet.route) {
            com.vibely.app.ui.wallet.WalletScreen()
        }
        composable(Screen.Gifts.route) {
            GiftsScreen()
        }
        composable(Screen.History.route) {
            HistoryScreen(viewModel = CallViewModel())
        }
        composable(Screen.Notifications.route) {
            NotificationsScreen()
        }
        composable(Screen.Settings.route) {
            SettingsScreen()
        }
        composable(Screen.Profile.route) {
            ProfileScreen()
        }
    }
}
