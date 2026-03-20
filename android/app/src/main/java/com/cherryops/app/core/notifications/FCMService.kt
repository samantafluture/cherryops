package com.cherryops.app.core.notifications

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class FCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "FCM token refreshed")
        // TODO: Send updated token to backend via BackendApiService.registerDevice()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d(TAG, "FCM message received from: ${message.from}")

        message.notification?.let { notification ->
            // TODO: Show local notification with task status update
            Log.d(TAG, "Notification title: ${notification.title}")
        }

        if (message.data.isNotEmpty()) {
            // TODO: Handle data payload (task status changes, etc.)
            Log.d(TAG, "Data payload: ${message.data}")
        }
    }

    companion object {
        private const val TAG = "FCMService"
    }
}
