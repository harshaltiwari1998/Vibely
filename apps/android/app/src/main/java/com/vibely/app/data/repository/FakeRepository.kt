package com.vibely.app.data.repository

import com.vibely.app.data.model.CallLog
import com.vibely.app.data.model.ChatMessage
import com.vibely.app.data.model.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class FakeRepository {
    val currentUser = User(id = "me", name = "You", isOnline = true)

    fun getRecommendations(): Flow<List<User>> = flow {
        emit(
            listOf(
                User("1", "Anna", isOnline = true),
                User("2", "Leo", isOnline = true),
                User("3", "Mia", isOnline = false),
                User("4", "Noah", isOnline = true)
            )
        )
    }

    fun getDiscoverUsers(): Flow<List<User>> = flow {
        emit(
            listOf(
                User("5", "Ava"),
                User("6", "Liam"),
                User("7", "Isabella"),
                User("8", "Mason"),
                User("9", "Charlotte"),
                User("10", "Lucas")
            )
        )
    }

    fun getMatches(): Flow<List<User>> = flow {
        emit(
            listOf(
                User("11", "Olivia"),
                User("12", "William"),
                User("13", "Amelia"),
                User("14", "Benjamin")
            )
        )
    }

    fun getChatMessages(userId: String): Flow<List<ChatMessage>> = flow {
        emit(
            listOf(
                ChatMessage("1", userId, "me", "Hey!"),
                ChatMessage("2", "me", userId, "Hi, how are you?"),
                ChatMessage("3", userId, "me", "I'm good, you?")
            )
        )
    }

    fun getCallHistory(): Flow<List<CallLog>> = flow {
        emit(
            listOf(
                CallLog("1", "1", com.vibely.app.data.model.CallType.VIDEO, com.vibely.app.data.model.CallStatus.COMPLETED, durationSeconds = 120),
                CallLog("2", "2", com.vibely.app.data.model.CallType.AUDIO, com.vibely.app.data.model.CallStatus.MISSED),
                CallLog("3", "3", com.vibely.app.data.model.CallType.VIDEO, com.vibely.app.data.model.CallStatus.COMPLETED, durationSeconds = 45)
            )
        )
    }
}
