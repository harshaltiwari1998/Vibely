package com.vibely.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
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

    Surface(modifier = Modifier.fillMaxSize()) {
        VibelyNavGraph(navController = navController, authViewModel = authViewModel, api = apiService, tokenManager = tokenManager)
    }
}
