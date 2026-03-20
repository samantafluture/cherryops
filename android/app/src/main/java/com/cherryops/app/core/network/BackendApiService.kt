package com.cherryops.app.core.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface BackendApiService {

    // -- Auth --

    @POST("api/auth/github/callback")
    suspend fun exchangeGitHubCode(
        @Body body: GitHubCodeExchangeRequest
    ): Response<AuthTokenResponse>

    @POST("api/auth/refresh")
    suspend fun refreshToken(
        @Body body: RefreshTokenRequest
    ): Response<AuthTokenResponse>

    // -- Projects --

    @GET("api/projects")
    suspend fun listProjects(): Response<List<ProjectResponse>>

    @POST("api/projects")
    suspend fun createProject(
        @Body body: CreateProjectRequest
    ): Response<ProjectResponse>

    @GET("api/projects/{projectId}")
    suspend fun getProject(
        @Path("projectId") projectId: String
    ): Response<ProjectResponse>

    // -- Skills --

    @GET("api/skills")
    suspend fun listSkills(
        @Query("category") category: String? = null
    ): Response<List<SkillResponse>>

    @GET("api/skills/{skillId}")
    suspend fun getSkill(
        @Path("skillId") skillId: String
    ): Response<SkillResponse>

    // -- Tasks / Dispatch --

    @POST("api/tasks/dispatch")
    suspend fun dispatchTask(
        @Body body: DispatchTaskRequest
    ): Response<TaskResponse>

    @GET("api/tasks/{taskId}")
    suspend fun getTask(
        @Path("taskId") taskId: String
    ): Response<TaskResponse>

    @GET("api/tasks")
    suspend fun listTasks(
        @Query("projectId") projectId: String? = null,
        @Query("status") status: String? = null
    ): Response<List<TaskResponse>>

    @PUT("api/tasks/{taskId}/review")
    suspend fun reviewTask(
        @Path("taskId") taskId: String,
        @Body body: ReviewTaskRequest
    ): Response<TaskResponse>

    // -- Device / Notifications --

    @POST("api/devices/register")
    suspend fun registerDevice(
        @Body body: RegisterDeviceRequest
    ): Response<Unit>
}

// -- Request DTOs --

data class GitHubCodeExchangeRequest(
    val code: String,
    val codeVerifier: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class CreateProjectRequest(
    val name: String,
    val repoFullName: String,
    val defaultBranch: String
)

data class DispatchTaskRequest(
    val projectId: String,
    val skillId: String,
    val inputs: Map<String, String> = emptyMap(),
    val targetPath: String? = null,
    val branch: String? = null
)

data class ReviewTaskRequest(
    val approved: Boolean,
    val comment: String? = null
)

data class RegisterDeviceRequest(
    val fcmToken: String,
    val platform: String = "android"
)

// -- Response DTOs --

data class AuthTokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)

data class ProjectResponse(
    val id: String,
    val name: String,
    val repoFullName: String,
    val defaultBranch: String,
    val createdAt: String,
    val updatedAt: String
)

data class SkillResponse(
    val id: String,
    val name: String,
    val description: String,
    val category: String,
    val inputs: List<SkillInputResponse>,
    val version: String
)

data class SkillInputResponse(
    val name: String,
    val type: String,
    val required: Boolean,
    val description: String?,
    val defaultValue: String?
)

data class TaskResponse(
    val id: String,
    val projectId: String,
    val skillId: String,
    val status: String,
    val inputs: Map<String, String>,
    val output: TaskOutputResponse?,
    val createdAt: String,
    val updatedAt: String
)

data class TaskOutputResponse(
    val summary: String?,
    val filesChanged: List<String>?,
    val prUrl: String?,
    val logs: String?
)
