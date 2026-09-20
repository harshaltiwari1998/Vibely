package com.vibely.app.data.remote.dto

data class CreatePaymentRequest(
    val coins: Int,
    val amount: Int,
    val currency: String = "INR"
)

data class CreatePaymentResponse(
    val paymentId: String,
    val providerRef: String,
    val amount: Int,
    val currency: String,
    val status: String,
    val providerKeyId: String? = null
)

data class VerifyPaymentRequestBody(
    val providerPaymentId: String? = null,
    val signature: String? = null
)

data class VerifyPaymentResponseBody(
    val id: String,
    val status: String,
    val coins: Int
)
