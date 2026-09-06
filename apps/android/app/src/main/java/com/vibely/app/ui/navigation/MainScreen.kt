package com.vibely.app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
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
import com.vibely.app.ui.viewmodel.CallViewModel
import com.vibely.app.ui.viewmodel.ChatViewModel
import com.vibely.app.ui.viewmodel.DiscoverViewModel
import com.vibely.app.ui.viewmodel.HomeViewModel
import com.vibely.app.ui.viewmodel.MatchViewModel
import com.vibely.app.ui.wallet.WalletScreen

data class BottomItem(val label: String, val icon: ImageVector, val route: String, val badge: Int? = null)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(navController: NavHostController) {
    val items = listOf(
        BottomItem("Home", Icons.Filled.Home, Screen.Home.route),
        BottomItem("Discover", Icons.Filled.PhotoLibrary, Screen.Discover.route),
        BottomItem("Match", Icons.Filled.Favorite, Screen.Match.route),
        BottomItem("Call", Icons.Filled.Call, Screen.Call.route),
        BottomItem("Chat", Icons.AutoMirrored.Filled.Send, Screen.Chat.createRoute("me"), badge = 2),
        BottomItem("Wallet", Icons.Filled.Wallet, Screen.Wallet.route),
        BottomItem("Gifts", Icons.Filled.CardGiftcard, Screen.Gifts.route),
        BottomItem("History", Icons.AutoMirrored.Filled.List, Screen.History.route),
        BottomItem("Notifications", Icons.Filled.Notifications, Screen.Notifications.route, badge = 3),
        BottomItem("Settings", Icons.Filled.Settings, Screen.Settings.route),
        BottomItem("Profile", Icons.Filled.AccountCircle, Screen.Profile.route)
    )
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route
    val selected = items.indexOfFirst { it.route == currentRoute }.takeIf { it >= 0 } ?: 0

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text(items[selected].label, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = Color(0xFF7C3AED),
                            titleContentColor = Color.White
                        )
                    )
                },
                bottomBar = {
                    BottomAppBar(containerColor = Color.White, tonalElevation = 8.dp) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            items.forEachIndexed { index, item ->
                                val selectedColor = if (selected == index) Color(0xFF7C3AED) else Color.Gray
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable {
                                            navController.navigate(item.route) {
                                                popUpTo(Screen.Main.route)
                                                launchSingleTop = true
                                            }
                                        }
                                        .padding(vertical = 6.dp)
                                ) {
                                    BadgedBox(
                                        badge = {
                                            if (item.badge != null) {
                                                Badge(containerColor = Color(0xFFEF4444), contentColor = Color.White) {
                                                    Text(item.badge.toString())
                                                }
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = item.icon,
                                            contentDescription = item.label,
                                            tint = selectedColor,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                    Text(
                                        text = item.label,
                                        color = selectedColor,
                                        fontSize = 10.sp,
                                        fontWeight = if (selected == index) FontWeight.Bold else FontWeight.Normal,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            ) { padding ->
                Box(modifier = Modifier.fillMaxSize().padding(padding).background(Color(0xFFF8FAFC))) {
                    androidx.navigation.compose.NavHost(
                        navController = navController,
                        startDestination = Screen.Home.route
                    ) {
                        composable(Screen.Home.route) { HomeScreen(viewModel = com.vibely.app.ui.viewmodel.HomeViewModel()) }
                        composable(Screen.Discover.route) { DiscoverScreen(viewModel = com.vibely.app.ui.viewmodel.DiscoverViewModel()) }
                        composable(Screen.Match.route) { MatchScreen(viewModel = com.vibely.app.ui.viewmodel.MatchViewModel()) }
                        composable(Screen.Call.route) { CallScreen(viewModel = com.vibely.app.ui.viewmodel.CallViewModel()) }
                        composable(Screen.Chat.route, arguments = listOf(androidx.navigation.navArgument("userId") { type = androidx.navigation.NavType.StringType })) { backStackEntry ->
                            val userId = backStackEntry.arguments?.getString("userId") ?: ""
                            ChatScreen(userId = userId, viewModel = com.vibely.app.ui.viewmodel.ChatViewModel())
                        }
                        composable(Screen.Wallet.route) { com.vibely.app.ui.wallet.WalletScreen() }
                        composable(Screen.Gifts.route) { GiftsScreen() }
                        composable(Screen.History.route) { HistoryScreen(viewModel = com.vibely.app.ui.viewmodel.CallViewModel()) }
                        composable(Screen.Notifications.route) { NotificationsScreen() }
                        composable(Screen.Settings.route) { SettingsScreen() }
                        composable(Screen.Profile.route) { ProfileScreen() }
                    }
                }
            }
        }
    }
}
