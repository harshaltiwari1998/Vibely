package com.vibely.app.data.remote.dto

data class LevelStatusResponse(
    val xp: Int,
    val level: Int,
    val currentLevelXp: Int,
    val xpToNextLevel: Int
)

data class LeaderboardEntry(
    val id: String,
    val username: String,
    val avatarUrl: String? = null,
    val xp: Int,
    val level: Int
)

data class BadgeResponse(
    val id: String,
    val name: String,
    val description: String,
    val icon: String,
    val earned: Boolean
)

data class BadgesResponse(
    val badges: List<BadgeResponse>,
    val featuredBadgeId: String? = null
)

data class SetFeaturedBadgeRequest(
    val badgeId: String?
)

data class SetFeaturedBadgeResponse(
    val featuredBadgeId: String?
)

data class MallItemResponse(
    val id: String,
    val name: String,
    val category: String,
    val iconUrl: String,
    val price: Int,
    val active: Boolean
)

data class MallInventoryItemResponse(
    val id: String,
    val itemId: String,
    val equipped: Boolean,
    val purchasedAt: String,
    val item: MallItemResponse
)

data class MallPurchaseRequest(
    val itemId: String
)

data class MallEquipRequest(
    val itemId: String
)

data class MallEquipResponse(
    val itemId: String,
    val equipped: Boolean
)

data class FamilySummaryResponse(
    val id: String,
    val name: String,
    val bio: String? = null,
    val ownerUsername: String,
    val memberCount: Int
)

data class FamilyMemberInfo(
    val id: String,
    val username: String,
    val avatarUrl: String? = null
)

data class FamilyMemberResponse(
    val id: String,
    val username: String,
    val avatarUrl: String? = null,
    val level: Int
)

data class FamilyDetailResponse(
    val id: String,
    val name: String,
    val bio: String? = null,
    val owner: FamilyMemberInfo,
    val members: List<FamilyMemberResponse>
)

data class CreateFamilyRequest(
    val name: String,
    val bio: String? = null
)

data class FamilyLeaderboardEntry(
    val id: String,
    val username: String,
    val avatarUrl: String? = null,
    val totalGiftsSent: Int
)

data class SimpleSuccessResponse(
    val success: Boolean
)
