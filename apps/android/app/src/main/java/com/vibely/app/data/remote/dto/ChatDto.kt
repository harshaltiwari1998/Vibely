package com.vibely.app.data.remote.dto

data class ChatPeerResponse(
    val id: String,
    val username: String,
    val avatarUrl: String? = null
)

data class ChatMessageResponse(
    val id: String,
    val chatId: String,
    val senderId: String,
    val content: String,
    val status: String,
    val createdAt: String
)

data class ChatSummaryResponse(
    val id: String,
    val peer: ChatPeerResponse,
    val lastMessage: ChatMessageResponse?,
    val updatedAt: String
)

data class ChatMessagesResponse(
    val items: List<ChatMessageResponse>,
    val total: Int
)

data class StartChatRequest(val userId: String)

data class StartChatResponse(val id: String)

data class SendMessageRequest(val chatId: String, val content: String)
