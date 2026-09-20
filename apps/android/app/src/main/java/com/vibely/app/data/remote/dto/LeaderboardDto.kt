package com.vibely.app.data.remote.dto

data class LeaderboardEntryResponse(
    val rank: Int,
    val userId: String,
    val username: String,
    val avatarUrl: String? = null,
    val amount: Int
)
