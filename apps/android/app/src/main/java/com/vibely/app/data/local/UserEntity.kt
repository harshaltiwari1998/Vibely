package com.vibely.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val username: String,
    val email: String,
    val gender: String,
    val country: String,
    val language: String,
    val avatarUrl: String?,
    val lastSeen: Long = 0,
)
