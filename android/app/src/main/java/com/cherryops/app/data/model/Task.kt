package com.cherryops.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

data class Task(
    val id: String,
    val projectId: String,
    val skillId: String,
    val status: TaskStatus,
    val inputs: Map<String, String>,
    val output: TaskOutput?,
    val createdAt: String,
    val updatedAt: String
)

data class TaskOutput(
    val summary: String?,
    val filesChanged: List<String>?,
    val prUrl: String?,
    val logs: String?
)

enum class TaskStatus(val value: String) {
    QUEUED("queued"),
    RUNNING("running"),
    AWAITING_REVIEW("awaiting_review"),
    APPROVED("approved"),
    REJECTED("rejected"),
    COMPLETED("completed"),
    FAILED("failed");

    companion object {
        fun fromValue(value: String): TaskStatus =
            entries.firstOrNull { it.value == value } ?: QUEUED
    }
}

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val skillId: String,
    val status: String,
    val inputsJson: String,
    val outputJson: String?,
    val createdAt: String,
    val updatedAt: String
)
