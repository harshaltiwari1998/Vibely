package com.vibely.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vibely.app.ui.components.Screen
import com.vibely.app.ui.theme.BrandLogo

@Composable
fun OnboardingScreen(onFinish: () -> Unit) {
    val pages = listOf("Meet new people", "Chat 1-to-1", "Send gifts & coins")
    val pagerState = rememberPagerState(pageCount = { pages.size })
    Screen(title = "", showTopBar = false) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            BrandLogo(showWordmark = true)
            HorizontalPager(state = pagerState) { page ->
                Text(pages[page])
            }
            Button(onClick = onFinish) { Text("Get started") }
        }
    }
}
