package com.cherryops.app.core.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface GitHubApiService {

    @GET("user/repos")
    suspend fun listRepos(
        @Query("per_page") perPage: Int = 30,
        @Query("page") page: Int = 1,
        @Query("sort") sort: String = "updated"
    ): Response<List<GitHubRepo>>

    @GET("repos/{owner}/{repo}/contents/{path}")
    suspend fun getContents(
        @Path("owner") owner: String,
        @Path("repo") repo: String,
        @Path("path", encoded = true) path: String = "",
        @Query("ref") ref: String? = null
    ): Response<List<GitHubContent>>

    @PUT("repos/{owner}/{repo}/contents/{path}")
    suspend fun putContents(
        @Path("owner") owner: String,
        @Path("repo") repo: String,
        @Path("path", encoded = true) path: String,
        @Body body: PutContentsRequest
    ): Response<PutContentsResponse>

    @GET("repos/{owner}/{repo}/git/trees/{treeSha}")
    suspend fun getTree(
        @Path("owner") owner: String,
        @Path("repo") repo: String,
        @Path("treeSha") treeSha: String,
        @Query("recursive") recursive: Boolean = true
    ): Response<GitHubTree>
}

// -- Request / Response DTOs --

data class GitHubRepo(
    val id: Long,
    val name: String,
    val full_name: String,
    val private: Boolean,
    val default_branch: String,
    val description: String?
)

data class GitHubContent(
    val name: String,
    val path: String,
    val sha: String,
    val size: Long,
    val type: String, // "file" | "dir" | "symlink" | "submodule"
    val content: String?,
    val encoding: String?,
    val download_url: String?
)

data class PutContentsRequest(
    val message: String,
    val content: String, // Base64 encoded
    val sha: String? = null,
    val branch: String? = null
)

data class PutContentsResponse(
    val content: GitHubContent?,
    val commit: GitHubCommitInfo?
)

data class GitHubCommitInfo(
    val sha: String,
    val message: String
)

data class GitHubTree(
    val sha: String,
    val tree: List<GitHubTreeEntry>,
    val truncated: Boolean
)

data class GitHubTreeEntry(
    val path: String,
    val mode: String,
    val type: String, // "blob" | "tree"
    val sha: String,
    val size: Long?
)
