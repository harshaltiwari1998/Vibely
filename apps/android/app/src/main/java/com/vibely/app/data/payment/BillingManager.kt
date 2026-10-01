package com.vibely.app.data.payment

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.UserChoiceBillingListener
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

sealed class BillingEvent {
    /** The user paid through Google Play; the backend must verify and credit it. */
    data class PlayPurchases(val purchases: List<Purchase>) : BillingEvent()

    /**
     * The user chose our own billing (Razorpay) on Play's user choice screen
     * (India). [externalTransactionToken] must go to the backend, which reports
     * the purchase to Google.
     */
    data class AlternativeBillingChosen(val productId: String, val externalTransactionToken: String) : BillingEvent()

    data object Cancelled : BillingEvent()
    data class Failed(val message: String) : BillingEvent()
}

/**
 * Google Play Billing for coin packs, with user choice billing enabled so
 * users in India can pick Razorpay instead (Play shows the choice screen).
 */
class BillingManager(context: Context) {
    private val _events = MutableSharedFlow<BillingEvent>(extraBufferCapacity = 8, onBufferOverflow = BufferOverflow.DROP_OLDEST)
    val events: SharedFlow<BillingEvent> = _events.asSharedFlow()

    private val userChoiceListener = UserChoiceBillingListener { details ->
        val productId = details.products.firstOrNull()?.id
        if (productId != null) {
            _events.tryEmit(BillingEvent.AlternativeBillingChosen(productId, details.externalTransactionToken))
        }
    }

    private val client: BillingClient = BillingClient.newBuilder(context.applicationContext)
        .setListener { result, purchases ->
            when (result.responseCode) {
                BillingClient.BillingResponseCode.OK ->
                    if (!purchases.isNullOrEmpty()) _events.tryEmit(BillingEvent.PlayPurchases(purchases))
                BillingClient.BillingResponseCode.USER_CANCELED -> _events.tryEmit(BillingEvent.Cancelled)
                else -> _events.tryEmit(BillingEvent.Failed(describe(result)))
            }
        }
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableUserChoiceBilling(userChoiceListener)
        .enableAutoServiceReconnection()
        .build()

    private suspend fun ensureConnected(): BillingResult {
        if (client.isReady) return BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.OK).build()
        return suspendCancellableCoroutine { cont ->
            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(result: BillingResult) {
                    if (cont.isActive) cont.resume(result)
                }

                override fun onBillingServiceDisconnected() {
                    if (cont.isActive) {
                        cont.resume(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.SERVICE_DISCONNECTED).build())
                    }
                }
            })
        }
    }

    /** Returns Play product details (localized prices) for the given in-app product IDs. */
    suspend fun queryProducts(productIds: List<String>): Map<String, ProductDetails> {
        if (productIds.isEmpty()) return emptyMap()
        val connection = ensureConnected()
        if (connection.responseCode != BillingClient.BillingResponseCode.OK) throw BillingUnavailableException(describe(connection))

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productIds.map {
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(it)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            })
            .build()
        return suspendCancellableCoroutine { cont ->
            client.queryProductDetailsAsync(params) { result, details ->
                if (!cont.isActive) return@queryProductDetailsAsync
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    cont.resume(details.productDetailsList.associateBy { it.productId })
                } else {
                    cont.resume(emptyMap())
                }
            }
        }
    }

    /**
     * Opens Play's purchase sheet. In India Play first shows the user choice
     * screen; picking our billing arrives as [BillingEvent.AlternativeBillingChosen].
     */
    fun launchPurchase(activity: Activity, product: ProductDetails, userId: String?) {
        val productParams = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).build()
        val flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productParams))
            .apply { if (userId != null) setObfuscatedAccountId(userId) }
            .build()
        val result = client.launchBillingFlow(activity, flow)
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            _events.tryEmit(BillingEvent.Failed(describe(result)))
        }
    }

    /** Completed purchases not yet consumed (e.g. the app died before the backend credited them). */
    suspend fun unconsumedPurchases(): List<Purchase> {
        if (ensureConnected().responseCode != BillingClient.BillingResponseCode.OK) return emptyList()
        val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()
        return suspendCancellableCoroutine { cont ->
            client.queryPurchasesAsync(params) { result, purchases ->
                if (!cont.isActive) return@queryPurchasesAsync
                cont.resume(
                    if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                        purchases.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                    } else {
                        emptyList()
                    }
                )
            }
        }
    }

    fun close() {
        client.endConnection()
    }

    private fun describe(result: BillingResult): String = when (result.responseCode) {
        BillingClient.BillingResponseCode.BILLING_UNAVAILABLE -> "Google Play billing isn't available on this device"
        BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> "A previous purchase is still being processed"
        BillingClient.BillingResponseCode.ITEM_UNAVAILABLE -> "This pack isn't available right now"
        BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE,
        BillingClient.BillingResponseCode.SERVICE_DISCONNECTED,
        BillingClient.BillingResponseCode.NETWORK_ERROR -> "Couldn't reach Google Play. Check your connection"
        else -> result.debugMessage.ifBlank { "Payment failed (${result.responseCode})" }
    }
}

class BillingUnavailableException(message: String) : Exception(message)
