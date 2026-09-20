package com.vibely.app.ui.navigation

sealed class Screen(val route: String) {
    data object Auth : Screen("auth")
    data object Login : Screen("login")
    data object Signup : Screen("signup")
    data object Main : Screen("main")
    data object Match : Screen("match")
    data object Search : Screen("search")
    data object Messages : Screen("messages")
    data object Profile : Screen("profile")
    data object Tasks : Screen("tasks")
    data object Invitation : Screen("invitation")
    data object Wallet : Screen("wallet")
    data object Vip : Screen("vip")
    data object Settings : Screen("settings")
    data object History : Screen("history")
    data object Notifications : Screen("notifications")
    data object Gifts : Screen("gifts")
    data object Call : Screen("call")
    data object Live : Screen("live")
    data object GoLive : Screen("live/go-live")
    data object LiveRoom : Screen("live/{roomId}") {
        fun createRoute(roomId: String) = "live/$roomId"
    }
    data object Chat : Screen("chat/{userId}") {
        fun createRoute(userId: String) = "chat/$userId"
    }
}
