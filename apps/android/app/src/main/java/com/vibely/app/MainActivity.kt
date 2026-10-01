package com.vibely.app

import android.graphics.Color as AndroidColor
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.compose.rememberNavController
import com.razorpay.Checkout
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import com.vibely.app.data.local.TokenManager
import com.vibely.app.data.payment.RazorpayCheckoutBridge
import com.vibely.app.data.remote.ApiClient
import com.vibely.app.ui.navigation.VibelyNavGraph
import com.vibely.app.ui.viewmodel.AuthViewModel

class MainActivity : ComponentActivity(), PaymentResultWithDataListener {
    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_Vibely)
        // targetSdk 35+ forces edge-to-edge on Android 15+, so opt in on every
        // version for consistent layout and pad the content in VibelyApp.
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
        )
        super.onCreate(savedInstanceState)
        Checkout.preload(applicationContext)
        setContent {
            VibelyApp()
        }
    }

    override fun onPaymentSuccess(razorpayPaymentId: String?, data: PaymentData?) {
        RazorpayCheckoutBridge.onResult?.invoke(true, razorpayPaymentId, data?.signature, null)
    }

    override fun onPaymentError(code: Int, description: String?, data: PaymentData?) {
        RazorpayCheckoutBridge.onResult?.invoke(false, null, null, description ?: "Payment failed")
    }
}

@Composable
fun VibelyApp() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val navController = rememberNavController()
    val apiService = ApiClient.getClient(context)
    val tokenManager = TokenManager(context.applicationContext)
    val authViewModel = AuthViewModel(apiService, tokenManager)

    // Screens don't handle window insets individually; pad once here so nothing
    // draws under the status/navigation bars or the keyboard. The bar areas
    // show the brand color behind them.
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF4A0026))) {
        Surface(modifier = Modifier.fillMaxSize().safeDrawingPadding()) {
            VibelyNavGraph(navController = navController, authViewModel = authViewModel, api = apiService, tokenManager = tokenManager)
        }
    }
}
