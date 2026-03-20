package com.cherryops.app.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.cherryops.app.MainActivity
import com.cherryops.app.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class FCMService : FirebaseMessagingService() {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "FCM token refreshed")
        // Token registration happens on app launch via BackendApiService.registerDevice()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d(TAG, "FCM message received from: ${message.from}")

        val data = message.data
        val taskId = data["task_id"]
        val status = data["status"]
        val type = data["type"]

        val title = message.notification?.title ?: buildTitle(status)
        val body = message.notification?.body ?: buildBody(status, taskId)

        showNotification(title, body, taskId, status)
    }

    private fun showNotification(
        title: String,
        body: String,
        taskId: String?,
        status: String?
    ) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            // Deep link to task review or status based on status
            taskId?.let {
                putExtra(EXTRA_TASK_ID, it)
                putExtra(EXTRA_NAV_ROUTE, when (status) {
                    "complete" -> "task/$it/review"
                    else -> "task/$it/status"
                })
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            taskId?.hashCode() ?: 0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(taskId?.hashCode() ?: System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Task Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for AI task status updates"
            }
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildTitle(status: String?): String = when (status) {
        "complete" -> "Task Complete"
        "error" -> "Task Failed"
        "running" -> "Task Started"
        else -> "Task Update"
    }

    private fun buildBody(status: String?, taskId: String?): String {
        val shortId = taskId?.take(8) ?: "unknown"
        return when (status) {
            "complete" -> "Task $shortId is ready for review."
            "error" -> "Task $shortId encountered an error."
            "running" -> "Task $shortId is now running."
            else -> "Task $shortId status: $status"
        }
    }

    companion object {
        private const val TAG = "FCMService"
        private const val CHANNEL_ID = "cherryops_tasks"
        const val EXTRA_TASK_ID = "extra_task_id"
        const val EXTRA_NAV_ROUTE = "extra_nav_route"
    }
}
