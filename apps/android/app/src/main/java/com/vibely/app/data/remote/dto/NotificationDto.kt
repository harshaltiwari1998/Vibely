package com.vibely.app.data.remote.dto

data class NotificationResponse(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val read: Boolean,
    val createdAt: String
)

data class NotificationsListResponse(
    val items: List<NotificationResponse>,
    val total: Int
)
