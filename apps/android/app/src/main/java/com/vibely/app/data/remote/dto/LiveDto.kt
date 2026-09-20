package com.vibely.app.data.remote.dto

data class LiveHostResponse(
    val id: String,
    val username: String,
    val avatarUrl: String? = null
)

data class LiveRoomResponse(
    val id: String,
    val title: String,
    val status: String,
    val country: String? = null,
    val coverUrl: String? = null,
    val peakViewers: Int = 0,
    val startedAt: String,
    val host: LiveHostResponse
)

data class StartLiveRequest(
    val title: String,
    val country: String? = null
)

data class LiveSessionResponse(
    val room: LiveRoomResponse,
    val token: String,
    val livekitUrl: String
)

data class GiftResponse(
    val id: String,
    val name: String,
    val iconUrl: String,
    val coinCost: Int
)
