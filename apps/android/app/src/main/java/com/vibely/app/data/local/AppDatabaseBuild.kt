package com.vibely.app.data.local

import android.content.Context
import androidx.room.Room

/**
 * Builds the Room database. Falls back to an in-memory instance only for
 * previews/tests; production always uses a file-backed DB.
 */
fun AppDatabase.Companion.build(context: Context): AppDatabase {
    return Room.databaseBuilder(context, AppDatabase::class.java, "vibely.db")
        .fallbackToDestructiveMigration()
        .build()
}
