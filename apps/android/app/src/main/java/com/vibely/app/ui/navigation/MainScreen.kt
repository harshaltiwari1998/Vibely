package com.vibely.app.ui.navigation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.vibely.app.data.realtime.SocketManager
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.data.remote.ApiService
import com.vibely.app.ui.badges.BadgesScreen
import com.vibely.app.ui.call.CallScreen
import com.vibely.app.ui.chat.ChatScreen
import com.vibely.app.ui.chatprice.ChatPriceScreen
import com.vibely.app.ui.family.FamilyScreen
import com.vibely.app.ui.gifts.GiftsScreen
import com.vibely.app.ui.history.HistoryScreen
import com.vibely.app.ui.invitation.InvitationScreen
import com.vibely.app.ui.leaderboard.LeaderboardScreen
import com.vibely.app.ui.level.LevelScreen
import com.vibely.app.ui.live.GoLiveScreen
import com.vibely.app.ui.live.LiveFeedScreen
import com.vibely.app.ui.live.LiveViewerScreen
import com.vibely.app.ui.mall.MallScreen
import com.vibely.app.ui.match.MatchScreen
import com.vibely.app.ui.messages.MessageListScreen
import com.vibely.app.ui.notifications.NotificationsScreen
import com.vibely.app.ui.party.PartyRoomScreen
import com.vibely.app.ui.profile.ProfileScreen
import com.vibely.app.ui.search.SearchScreen
import com.vibely.app.ui.settings.BlocklistScreen
import com.vibely.app.ui.settings.SettingsScreen
import com.vibely.app.ui.tasks.TaskCenterScreen
import com.vibely.app.ui.viewmodel.BadgesViewModel
import com.vibely.app.ui.viewmodel.CallViewModel
import com.vibely.app.ui.viewmodel.ChatPriceViewModel
import com.vibely.app.ui.viewmodel.ChatViewModel
import com.vibely.app.ui.viewmodel.SearchViewModel
import com.vibely.app.ui.viewmodel.FamilyViewModel
import com.vibely.app.ui.viewmodel.LeaderboardViewModel
import com.vibely.app.ui.viewmodel.LevelViewModel
import com.vibely.app.ui.viewmodel.LiveFeedViewModel
import com.vibely.app.ui.viewmodel.MallViewModel
import com.vibely.app.ui.viewmodel.MatchViewModel
import com.vibely.app.ui.viewmodel.MessagesViewModel
import com.vibely.app.ui.viewmodel.BlocklistViewModel
import com.vibely.app.ui.viewmodel.NotificationsViewModel
import com.vibely.app.ui.viewmodel.PartyListViewModel
import com.vibely.app.ui.viewmodel.ReferralViewModel
import com.vibely.app.ui.viewmodel.TaskViewModel
import com.vibely.app.ui.viewmodel.VipViewModel
import com.vibely.app.ui.viewmodel.WalletViewModel
import com.vibely.app.ui.viewmodel.WithdrawalViewModel
import com.vibely.app.ui.vip.VipScreen
import com.vibely.app.ui.wallet.WalletScreen
import com.vibely.app.ui.withdraw.WithdrawScreen
import kotlinx.coroutines.launch
import org.json.JSONObject

data class MainTab(val route: String, val label: String, val icon: ImageVector)

private data class IncomingMatchRequest(
    val matchId: String,
    val requesterId: String,
    val requesterUsername: String,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(api: ApiService, token: String?, userId: String?, onLogout: () -> Unit) {
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()
    var incomingRequest by remember { mutableStateOf<IncomingMatchRequest?>(null) }
    var respondingToRequest by remember { mutableStateOf(false) }

    val walletViewModel = remember { WalletViewModel(api) }
    val messagesViewModel = remember { MessagesViewModel(api) }
    val notificationsViewModel = remember { NotificationsViewModel(api) }
    val callViewModel = remember { CallViewModel(api) }
    val partyListViewModel = remember { PartyListViewModel(api) }

    // Mounted once for the whole logged-in session (unlike the per-tab
    // screens below), so an incoming random-match request can pop up no
    // matter which tab the user is currently on.
    DisposableEffect(token) {
        val accessToken = token
        if (accessToken == null) return@DisposableEffect onDispose {}

        val sock = SocketManager.getDefaultSocket(ApiClient.socketBaseUrl(), accessToken)
        val onIncoming: (Array<Any>) -> Unit = { args ->
            val data = args.getOrNull(0) as? JSONObject
            if (data != null) {
                incomingRequest = IncomingMatchRequest(
                    matchId = data.optString("matchId"),
                    requesterId = data.optString("requesterId"),
                    requesterUsername = data.optString("requesterUsername"),
                )
            }
        }
        val onClosed: (Array<Any>) -> Unit = { args ->
            val data = args.getOrNull(0) as? JSONObject
            val matchId = data?.optString("matchId")
            if (matchId != null && incomingRequest?.matchId == matchId) {
                incomingRequest = null
            }
        }
        sock.on("match_request_incoming", onIncoming)
        sock.on("match_request_closed", onClosed)

        onDispose {
            sock.off("match_request_incoming", onIncoming)
            sock.off("match_request_closed", onClosed)
        }
    }

    incomingRequest?.let { request ->
        AlertDialog(
            onDismissRequest = { incomingRequest = null },
            title = { Text(request.requesterUsername) },
            text = { Text("wants a random video call") },
            confirmButton = {
                TextButton(
                    enabled = !respondingToRequest,
                    onClick = {
                        respondingToRequest = true
                        scope.launch {
                            try {
                                val resp = api.acceptMatch(mapOf("matchId" to request.matchId))
                                incomingRequest = null
                                if (resp.success && resp.data != null) {
                                    navController.navigate("call/${resp.data.callId}/${resp.data.otherUserId}/true")
                                }
                            } catch (_: Exception) {
                                incomingRequest = null
                            } finally {
                                respondingToRequest = false
                            }
                        }
                    }
                ) { Text("Accept") }
            },
            dismissButton = {
                TextButton(onClick = { incomingRequest = null }) { Text("Decline") }
            }
        )
    }

    val tabs = listOf(
        MainTab(Screen.Match.route, "Match", Icons.Filled.Favorite),
        MainTab(Screen.Live.route, "Live", Icons.Filled.Videocam),
        MainTab(Screen.Search.route, "Search", Icons.Filled.Search),
        MainTab(Screen.Messages.route, "Message", Icons.AutoMirrored.Filled.Send),
        MainTab(Screen.Profile.route, "Profile", Icons.Filled.AccountCircle),
    )
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Match.route
    val selected = tabs.indexOfFirst { it.route == currentRoute }.takeIf { it >= 0 } ?: 0

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(tabs[selected].label, fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.History.route) }) {
                        Icon(Icons.AutoMirrored.Filled.List, contentDescription = "Call history", tint = Color.White)
                    }
                    IconButton(onClick = { navController.navigate(Screen.Notifications.route) }) {
                        Icon(Icons.Filled.Notifications, contentDescription = "Notifications", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF4A0026), titleContentColor = Color.White)
            )
        },
        bottomBar = {
            BottomAppBar(containerColor = Color(0xFF2A0018)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    tabs.forEachIndexed { index, tab ->
                        val sel = selected == index
                        val color = if (sel) Color(0xFFFF1470) else Color.White.copy(alpha = 0.5f)
                        androidx.compose.foundation.layout.Column(
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    if (tabs[index].route != currentRoute) {
                                        navController.navigate(tabs[index].route) {
                                            popUpTo(0)
                                            launchSingleTop = true
                                        }
                                    }
                                }
                                .padding(vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(imageVector = tab.icon, contentDescription = tab.label, tint = color, modifier = Modifier.size(24.dp))
                            Text(text = tab.label, color = color, fontSize = 10.sp, fontWeight = if (sel) FontWeight.Bold else FontWeight.Normal, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            NavHost(navController = navController, startDestination = Screen.Match.route) {
                composable(Screen.Match.route) {
                    val matchViewModel = remember { MatchViewModel(api, token, userId) }
                    MatchScreen(
                        viewModel = matchViewModel,
                        walletViewModel = walletViewModel,
                        onNavigateToCall = { callId, peerId, isInitiator ->
                            navController.navigate("call/$callId/$peerId/$isInitiator")
                        }
                    )
                }
                composable(Screen.Live.route) {
                    val liveFeedViewModel = remember { LiveFeedViewModel(api) }
                    LiveFeedScreen(
                        viewModel = liveFeedViewModel,
                        partyListViewModel = partyListViewModel,
                        onOpenRoom = { roomId -> navController.navigate("live/$roomId") },
                        onGoLive = { navController.navigate(Screen.GoLive.route) },
                        onOpenPartyRoom = { roomId -> navController.navigate(Screen.PartyRoom.createRoute(roomId)) }
                    )
                }
                composable(Screen.GoLive.route) {
                    GoLiveScreen(api = api, onEnded = { navController.popBackStack() })
                }
                composable(Screen.LiveRoom.route, arguments = listOf(navArgument("roomId") { type = NavType.StringType })) { backStackEntry ->
                    val roomId = backStackEntry.arguments?.getString("roomId") ?: ""
                    LiveViewerScreen(api = api, roomId = roomId, onEnded = { navController.popBackStack() })
                }
                composable(Screen.PartyRoom.route, arguments = listOf(navArgument("roomId") { type = NavType.StringType })) { backStackEntry ->
                    val roomId = backStackEntry.arguments?.getString("roomId") ?: ""
                    PartyRoomScreen(api = api, roomId = roomId, myUserId = userId, onEnded = { navController.popBackStack() })
                }
                composable(Screen.Search.route) {
                    val searchViewModel = remember { SearchViewModel(api) }
                    SearchScreen(viewModel = searchViewModel)
                }
                composable(Screen.Messages.route) {
                    MessageListScreen(viewModel = messagesViewModel, onOpenChat = { id -> navController.navigate("chat/$id") })
                }
                composable(Screen.Profile.route) {
                    ProfileScreen(
                        walletViewModel = walletViewModel,
                        onOpenTasks = { navController.navigate(Screen.Tasks.route) },
                        onOpenInvitation = { navController.navigate(Screen.Invitation.route) },
                        onOpenWallet = { navController.navigate(Screen.Wallet.route) },
                        onOpenSettings = { navController.navigate(Screen.Settings.route) },
                        onOpenVip = { navController.navigate(Screen.Vip.route) },
                        onOpenLevel = { navController.navigate(Screen.Level.route) },
                        onOpenBadges = { navController.navigate(Screen.Badges.route) },
                        onOpenFamily = { navController.navigate(Screen.Family.route) },
                        onOpenMall = { navController.navigate(Screen.Mall.route) },
                        onOpenChatPrice = { navController.navigate(Screen.ChatPrice.route) },
                        onOpenLeaderboard = { navController.navigate(Screen.Leaderboard.route) }
                    )
                }
                composable(Screen.Leaderboard.route) {
                    val leaderboardViewModel = remember { LeaderboardViewModel(api) }
                    LeaderboardScreen(viewModel = leaderboardViewModel, onBack = { navController.popBackStack() })
                }
                composable(Screen.Withdraw.route) {
                    val withdrawalViewModel = remember { WithdrawalViewModel(api) }
                    WithdrawScreen(api = api, viewModel = withdrawalViewModel, onBack = { navController.popBackStack() })
                }
                composable(Screen.Tasks.route) {
                    val taskViewModel = remember { TaskViewModel(api) }
                    TaskCenterScreen(viewModel = taskViewModel, onWalletChanged = { walletViewModel.refresh() }, onBack = { navController.popBackStack() })
                }
                composable(Screen.Invitation.route) {
                    val referralViewModel = remember { ReferralViewModel(api) }
                    InvitationScreen(viewModel = referralViewModel, onBack = { navController.popBackStack() })
                }
                composable(Screen.Level.route) {
                    val levelViewModel = remember { LevelViewModel(api) }
                    LevelScreen(viewModel = levelViewModel, onBack = { navController.popBackStack() })
                }
                composable(Screen.Badges.route) {
                    val badgesViewModel = remember { BadgesViewModel(api) }
                    BadgesScreen(viewModel = badgesViewModel, onBack = { navController.popBackStack() })
                }
                composable(Screen.Family.route) {
                    val familyViewModel = remember { FamilyViewModel(api) }
                    FamilyScreen(viewModel = familyViewModel, myUserId = userId)
                }
                composable(Screen.Mall.route) {
                    val mallViewModel = remember { MallViewModel(api) }
                    MallScreen(viewModel = mallViewModel, onWalletChanged = { walletViewModel.refresh() }, onBack = { navController.popBackStack() })
                }
                composable(Screen.ChatPrice.route) {
                    val chatPriceViewModel = remember { ChatPriceViewModel(api) }
                    ChatPriceScreen(
                        viewModel = chatPriceViewModel,
                        onBack = { navController.popBackStack() },
                        onOpenWithdraw = { navController.navigate(Screen.Withdraw.route) }
                    )
                }
                composable(Screen.Wallet.route) { WalletScreen(viewModel = walletViewModel) }
                composable(Screen.Vip.route) {
                    val vipViewModel = remember { VipViewModel(api) }
                    VipScreen(viewModel = vipViewModel, onWalletChanged = { walletViewModel.refresh() })
                }
                composable(Screen.Settings.route) {
                    SettingsScreen(onLogout = onLogout, onOpenBlacklist = { navController.navigate(Screen.Blacklist.route) })
                }
                composable(Screen.Blacklist.route) {
                    val blocklistViewModel = remember { BlocklistViewModel(api) }
                    BlocklistScreen(viewModel = blocklistViewModel)
                }
                composable(Screen.History.route) { HistoryScreen(viewModel = callViewModel) }
                composable(Screen.Notifications.route) { NotificationsScreen(viewModel = notificationsViewModel) }
                composable(Screen.Gifts.route) { GiftsScreen(api = api) }
                composable(Screen.Chat.route, arguments = listOf(navArgument("userId") { type = NavType.StringType })) { backStackEntry ->
                    val peerId = backStackEntry.arguments?.getString("userId") ?: ""
                    val chatViewModel = remember(peerId) { ChatViewModel(api, userId) }
                    ChatScreen(userId = peerId, myUserId = userId, viewModel = chatViewModel, onWalletChanged = { walletViewModel.refresh() })
                }
                composable(
                    "call/{callId}/{peerId}/{isInitiator}",
                    arguments = listOf(
                        navArgument("callId") { type = NavType.StringType },
                        navArgument("peerId") { type = NavType.StringType },
                        navArgument("isInitiator") { type = NavType.BoolType },
                    )
                ) { backStackEntry ->
                    val callId = backStackEntry.arguments?.getString("callId") ?: ""
                    val peerId = backStackEntry.arguments?.getString("peerId") ?: ""
                    val isInitiator = backStackEntry.arguments?.getBoolean("isInitiator") ?: false
                    CallScreen(
                        callId = callId,
                        peerId = peerId,
                        isInitiator = isInitiator,
                        onEnded = { navController.popBackStack(Screen.Match.route, inclusive = false) }
                    )
                }
            }
        }
    }
}
