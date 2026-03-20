package com.cherryops.app.data.task

import com.cherryops.app.core.network.BackendApiService
import com.cherryops.app.core.network.DispatchTaskRequest
import com.cherryops.app.core.network.ReviewTaskRequest
import com.cherryops.app.core.network.TaskOutputResponse
import com.cherryops.app.core.network.TaskResponse
import com.cherryops.app.core.storage.TaskDao
import com.cherryops.app.data.model.Task
import com.cherryops.app.data.model.TaskEntity
import com.cherryops.app.data.model.TaskOutput
import com.cherryops.app.data.model.TaskStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    private val api: BackendApiService,
    private val taskDao: TaskDao,
    private val json: Json
) {

    suspend fun dispatchTask(
        projectId: String,
        brief: String,
        skillId: String? = null
    ): Result<Task> = withContext(Dispatchers.IO) {
        runCatching {
            val request = DispatchTaskRequest(
                projectId = projectId,
                skillId = skillId.orEmpty(),
                inputs = mapOf("brief" to brief)
            )
            val response = api.dispatchTask(request)
            if (response.isSuccessful) {
                val body = response.body()
                    ?: throw IllegalStateException("Empty response body")
                val task = body.toDomain()
                cacheTask(body)
                task
            } else {
                throw ApiException(
                    code = response.code(),
                    message = response.errorBody()?.string() ?: "Dispatch failed"
                )
            }
        }
    }

    suspend fun getTaskStatus(taskId: String): Result<TaskStatus> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.getTask(taskId)
                if (response.isSuccessful) {
                    val body = response.body()
                        ?: throw IllegalStateException("Empty response body")
                    cacheTask(body)
                    TaskStatus.fromValue(body.status)
                } else {
                    throw ApiException(
                        code = response.code(),
                        message = response.errorBody()?.string() ?: "Failed to get task status"
                    )
                }
            }
        }

    suspend fun getTaskResult(taskId: String): Result<Task> =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = api.getTask(taskId)
                if (response.isSuccessful) {
                    val body = response.body()
                        ?: throw IllegalStateException("Empty response body")
                    cacheTask(body)
                    body.toDomain()
                } else {
                    throw ApiException(
                        code = response.code(),
                        message = response.errorBody()?.string() ?: "Failed to get task result"
                    )
                }
            }
        }

    suspend fun approveTask(taskId: String): Result<Task> =
        withContext(Dispatchers.IO) {
            runCatching {
                val request = ReviewTaskRequest(approved = true)
                val response = api.reviewTask(taskId, request)
                if (response.isSuccessful) {
                    val body = response.body()
                        ?: throw IllegalStateException("Empty response body")
                    cacheTask(body)
                    body.toDomain()
                } else {
                    throw ApiException(
                        code = response.code(),
                        message = response.errorBody()?.string() ?: "Failed to approve task"
                    )
                }
            }
        }

    suspend fun redirectTask(taskId: String, newBrief: String): Result<Task> =
        withContext(Dispatchers.IO) {
            runCatching {
                val request = ReviewTaskRequest(
                    approved = false,
                    comment = newBrief
                )
                val response = api.reviewTask(taskId, request)
                if (response.isSuccessful) {
                    val body = response.body()
                        ?: throw IllegalStateException("Empty response body")
                    cacheTask(body)
                    body.toDomain()
                } else {
                    throw ApiException(
                        code = response.code(),
                        message = response.errorBody()?.string() ?: "Failed to redirect task"
                    )
                }
            }
        }

    suspend fun discardTask(taskId: String): Result<Task> =
        withContext(Dispatchers.IO) {
            runCatching {
                val request = ReviewTaskRequest(
                    approved = false,
                    comment = "__discard__"
                )
                val response = api.reviewTask(taskId, request)
                if (response.isSuccessful) {
                    val body = response.body()
                        ?: throw IllegalStateException("Empty response body")
                    cacheTask(body)
                    body.toDomain()
                } else {
                    throw ApiException(
                        code = response.code(),
                        message = response.errorBody()?.string() ?: "Failed to discard task"
                    )
                }
            }
        }

    suspend fun getCachedTask(taskId: String): Task? =
        withContext(Dispatchers.IO) {
            taskDao.getTaskById(taskId)?.toDomain()
        }

    private suspend fun cacheTask(response: TaskResponse) {
        val entity = TaskEntity(
            id = response.id,
            projectId = response.projectId,
            skillId = response.skillId,
            status = response.status,
            inputsJson = json.encodeToString(response.inputs),
            outputJson = response.output?.let { json.encodeToString(it) },
            createdAt = response.createdAt,
            updatedAt = response.updatedAt
        )
        taskDao.insertTask(entity)
    }

    private fun TaskResponse.toDomain(): Task = Task(
        id = id,
        projectId = projectId,
        skillId = skillId,
        status = TaskStatus.fromValue(status),
        inputs = inputs,
        output = output?.toDomain(),
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun TaskOutputResponse.toDomain(): TaskOutput = TaskOutput(
        summary = summary,
        filesChanged = filesChanged,
        prUrl = prUrl,
        logs = logs
    )

    private fun TaskEntity.toDomain(): Task = Task(
        id = id,
        projectId = projectId,
        skillId = skillId,
        status = TaskStatus.fromValue(status),
        inputs = outputJson?.let {
            runCatching { json.decodeFromString<Map<String, String>>(inputsJson) }.getOrDefault(emptyMap())
        } ?: emptyMap(),
        output = outputJson?.let {
            runCatching { json.decodeFromString<TaskOutputResponse>(it) }.getOrNull()?.toDomain()
        },
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

class ApiException(val code: Int, override val message: String) : Exception(message)
