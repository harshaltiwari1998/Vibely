package com.vibely.app.data.remote.dto

data class RequestWithdrawalBody(
    val beansAmount: Int,
    val upiId: String
)

data class WithdrawalResponse(
    val id: String,
    val userId: String,
    val beansAmount: Int,
    val payoutInr: Int,
    val upiId: String,
    val status: String,
    val requestedAt: String,
    val reviewedAt: String? = null,
    val reviewNote: String? = null
)

data class WithdrawalListResponse(
    val items: List<WithdrawalResponse>,
    val total: Int
)
