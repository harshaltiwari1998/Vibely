package com.vibely.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vibely.app.ui.screens.FavoritesScreen
import com.vibely.app.ui.screens.GiftsScreen
import com.vibely.app.ui.screens.HistoryScreen
import com.vibely.app.ui.screens.HomeScreen
import com.vibely.app.ui.screens.NotificationsScreen
import com.vibely.app.ui.screens.OnboardingScreen
import com.vibely.app.ui.screens.SplashScreen
import com.vibely.app.ui.screens.WalletScreen
import com.vibely.app.ui.screens.auth.ForgotPasswordScreen
import com.vibely.app.ui.screens.auth.LoginScreen
import com.vibely.app.ui.screens.auth.RegisterScreen
import com.vibely.app.ui.screens.call.VideoCallScreen
import com.vibely.app.ui.screens.chat.ChatScreen
import com.vibely.app.ui.screens.match.MatchScreen
import com.vibely.app.ui.screens.profile.ProfileScreen
import com.vibely.app.ui.screens.settings.SettingsScreen
import com.vibely.app.ui.screens.admin.AdminDashboardScreen
import com.vibely.app.ui.screens.admin.AdminUsersScreen
import com.vibely.app.ui.screens.admin.AdminReportsScreen
import com.vibely.app.ui.screens.admin.AdminModerationScreen
import com.vibely.app.ui.screens.admin.AdminAnalyticsScreen
import com.vibely.app.ui.screens.admin.AdminSettingsScreen

@Composable
fun AppNavHost(nav: NavHostController = rememberNavController()) {
    NavHost(navController = nav, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            SplashScreen(onTimeout = { nav.navigate(Routes.ONBOARDING) { popUpTo(Routes.SPLASH) { inclusive = true } } })
        }
        composable(Routes.ONBOARDING) {
            OnboardingScreen(onFinish = { nav.navigate(Routes.LOGIN) { popUpTo(Routes.ONBOARDING) { inclusive = true } } })
        }
        composable(Routes.LOGIN) { LoginScreen(nav) }
        composable(Routes.REGISTER) { RegisterScreen(nav) }
        composable(Routes.FORGOT_PASSWORD) { ForgotPasswordScreen(nav) }
        composable(Routes.HOME) { HomeScreen() }
        composable(Routes.DISCOVER) { DiscoverScreen() }
        composable(Routes.MATCH) { MatchScreen() }
        composable(Routes.CALL) { VideoCallScreen() }
        composable(Routes.CHAT) { ChatScreen() }
        composable(Routes.PROFILE) { ProfileScreen() }
        composable(Routes.WALLET) { WalletScreen() }
        composable(Routes.GIFTS) { GiftsScreen() }
        composable(Routes.FAVORITES) { FavoritesScreen() }
        composable(Routes.HISTORY) { HistoryScreen() }
        composable(Routes.NOTIFICATIONS) { NotificationsScreen() }
        composable(Routes.SETTINGS) { SettingsScreen() }
        composable(Routes.ADMIN_DASHBOARD) { AdminDashboardScreen() }
        composable(Routes.ADMIN_USERS) { AdminUsersScreen() }
        composable(Routes.ADMIN_REPORTS) { AdminReportsScreen() }
        composable(Routes.ADMIN_MODERATION) { AdminModerationScreen() }
        composable(Routes.ADMIN_ANALYTICS) { AdminAnalyticsScreen() }
        composable(Routes.ADMIN_SETTINGS) { AdminSettingsScreen() }
    }
}
