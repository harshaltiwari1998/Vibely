package com.vibely.app.data.remote.dto

data class SearchUserProfile(
    val bio: String? = null,
    val onlineStatus: String? = null
)

data class SearchUserResponse(
    val id: String,
    val username: String,
    val gender: String? = null,
    val country: String? = null,
    val avatarUrl: String? = null,
    val profile: SearchUserProfile? = null
)

data class SearchResultsResponse(
    val items: List<SearchUserResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)
