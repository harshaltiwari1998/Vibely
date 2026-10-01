package com.vibely.app.data.remote.dto

/** Server prices the order from the package; the client never sends amounts. */
data class CreatePaymentRequest(
    val packageId: String? = null,
    val playProductId: String? = null,
    /** From Play's user choice screen when the user picked Razorpay. */
    val externalTransactionToken: String? = null
)

data class CoinPackageResponse(
    val id: String,
    val name: String,
    val coins: Int,
    val price: Int,
    val currency: String,
    val playProductId: String? = null
)

data class GooglePlayVerifyRequest(
    val productId: String,
    val purchaseToken: String
)

data class GooglePlayVerifyResponse(
    val status: String,
    val paymentId: String? = null,
    val coins: Int = 0
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
