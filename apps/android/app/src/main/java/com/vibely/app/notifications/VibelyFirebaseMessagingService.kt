package com.vibely.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.vibely.app.MainActivity
import com.vibely.app.R
import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.ApiService
import com.vibely.app.data.remote.ApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class VibelyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        Log.d(TAG, "New FCM token generated")
        registerTokenWithBackend(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        Log.d(TAG, "Message received from: ${message.from}")

        val title = message.notification?.title ?: message.data["title"] ?: "Vibely"
        val body = message.notification?.body ?: message.data["body"] ?: ""
        val notificationId = message.data["notificationId"]
        val type = message.data["type"]

        showNotification(title, body, notificationId, type)
    }

    private fun showNotification(title: String, body: String, notificationId: String?, type: String?) {
        val channelId = "vibely_notifications"
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Vibely", NotificationManager.IMPORTANCE_HIGH)
            manager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra(EXTRA_NOTIFICATION_ID, notificationId)
            putExtra(EXTRA_NOTIFICATION_TYPE, type)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationId?.hashCode() ?: 0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(notificationId?.hashCode() ?: System.currentTimeMillis().toInt(), notification)
    }

    private fun registerTokenWithBackend(token: String) {
        val session = SessionPreferences(applicationContext)
        val api = ApiClient.create()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = session.userId.first() ?: return@launch
                val auth = "Bearer ${session.accessToken.first()}"
                val body = mapOf(
                    "deviceId" to getDeviceId(),
                    "platform" to "android",
                    "pushToken" to token,
                )
                api.registerDevice(auth, body)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register FCM token", e)
            }
        }
    }

    private fun getDeviceId(): String {
        return Build.ID ?: "unknown"
    }

    companion object {
        const val TAG = "VibelyFCM"
        const val EXTRA_NOTIFICATION_ID = "notification_id"
        const val EXTRA_NOTIFICATION_TYPE = "notification_type"
    }
}