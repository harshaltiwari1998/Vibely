package com.vibely.app.data.payment

/**
 * Razorpay's Checkout SDK only delivers its result to an Activity implementing
 * PaymentResultWithDataListener (MainActivity), not to whatever ViewModel
 * launched the checkout. This bridges that callback back to the caller.
 */
object RazorpayCheckoutBridge {
    var onResult: ((success: Boolean, razorpayPaymentId: String?, signature: String?, errorMessage: String?) -> Unit)? = null
}
