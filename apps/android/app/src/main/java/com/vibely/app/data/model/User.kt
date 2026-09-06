package com.vibely.app.data.model

data class User(
    val id: String,
    val name: String,
    val avatarUrl: String? = null,
    val isOnline: Boolean = false
)

data class ChatMessage(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val type: MessageType = MessageType.TEXT
)

enum class MessageType {
    TEXT, IMAGE, AUDIO, VIDEO
}

data class CallLog(
    val id: String,
    val userId: String,
    val type: CallType,
    val status: CallStatus,
    val timestamp: Long = System.currentTimeMillis(),
    val durationSeconds: Int = 0
)

enum class CallType {
    AUDIO, VIDEO
}

enum class CallStatus {
    MISSED, COMPLETED, ONGOING
}
