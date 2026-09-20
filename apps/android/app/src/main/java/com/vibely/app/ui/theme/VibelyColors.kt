package com.vibely.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Canonical color tokens for the app. Screens were built incrementally against
 * reference screenshots and drifted into several near-duplicate shades doing the
 * same job (e.g. three different "muted gray" hexes); new screens should pull
 * from here instead of hand-picking another close-enough hex.
 */
object VibelyColors {
    // Text
    val TextPrimary = Color(0xFF111827)
    val TextSecondary = Color(0xFF6B7280)
    val TextMuted = Color(0xFF9CA3AF)

    // Backgrounds
    val BackgroundLight = Color(0xFFF8FAFC)
    val Surface = Color.White

    // Brand accents
    val AccentPink = Color(0xFFFF5B82)
    val AccentPrimary = Color(0xFFFF1470)
    val AccentPurple = Color(0xFF7C3AED)
    val AccentPurpleBright = Color(0xFF9350F5)

    // Semantic
    val Error = Color(0xFFEF4444)
    val Success = Color(0xFF22C55E)

    // Dark chrome (top/bottom navigation bars)
    val NavBarDark = Color(0xFF4A0026)
    val NavBarDarker = Color(0xFF2A0018)
}
