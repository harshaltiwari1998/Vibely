package com.vibely.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = Brand600,
    secondary = Accent500,
    background = Surface,
    onBackground = Ink900,
)

private val DarkColors = darkColorScheme(
    primary = Brand500,
    secondary = Accent500,
    background = Ink900,
)

@Composable
fun VibelyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
