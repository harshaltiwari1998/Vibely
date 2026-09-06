package com.vibely.app.ui.navigation

sealed class Screen(val route: String) {
    data object Auth : Screen("auth")
    data object Login : Screen("login")
    data object Signup : Screen("signup")
    data object Otp : Screen("otp/{phone}") {
        fun createRoute(phone: String) = "otp/$phone"
    }
    data object Main : Screen("main")
    data object Home : Screen("home")
    data object Discover : Screen("discover")
    data object Match : Screen("match")
    data object Call : Screen("call")
    data object Chat : Screen("chat/{userId}") {
        fun createRoute(userId: String) = "chat/$userId"
    }
    data object Wallet : Screen("wallet")
    data object Gifts : Screen("gifts")
    data object History : Screen("history")
    data object Notifications : Screen("notifications")
    data object Settings : Screen("settings")
    data object Profile : Screen("profile")
}
