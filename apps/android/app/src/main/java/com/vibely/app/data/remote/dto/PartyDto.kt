package com.vibely.app.data.remote.dto

data class PartyHostResponse(
    val id: String,
    val username: String,
    val avatarUrl: String? = null
)

data class PartyRoomResponse(
    val id: String,
    val title: String,
    val status: String,
    val country: String? = null,
    val coverUrl: String? = null,
    val seatCount: Int = 8,
    val peakMembers: Int = 0,
    val startedAt: String,
    val host: PartyHostResponse,
    val memberCount: Int = 0
)

data class StartPartyRequest(
    val title: String,
    val country: String? = null,
    val seatCount: Int? = null
)

data class PartySeatResponse(
    val seatIndex: Int,
    val userId: String,
    val username: String,
    val avatarUrl: String? = null,
    val muted: Boolean = false
)

data class PartySessionResponse(
    val room: PartyRoomResponse,
    val seats: List<PartySeatResponse>,
    val token: String,
    val livekitUrl: String
)

data class PartySeatActionResponse(
    val seats: List<PartySeatResponse>,
    val token: String? = null
)
