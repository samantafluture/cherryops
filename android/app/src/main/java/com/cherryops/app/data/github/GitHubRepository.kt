package com.cherryops.app.data.github

import android.util.Base64
import com.cherryops.app.core.network.GitHubApiService
import com.cherryops.app.core.network.PutContentsRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GitHubRepository @Inject constructor(
    private val gitHubApi: GitHubApiService
) {

    suspend fun fetchFileTree(
        owner: String,
        repo: String,
        branch: String
    ): Result<List<FileNode>> {
        return try {
            val treeResponse = gitHubApi.getTree(owner, repo, branch, recursive = true)
            if (treeResponse.isSuccessful) {
                val tree = treeResponse.body() ?: return Result.failure(
                    Exception("Empty response from GitHub tree API")
                )
                val nodes = FileTreeParser.parse(tree.tree)
                Result.success(nodes)
            } else {
                Result.failure(
                    Exception("Failed to fetch tree: ${treeResponse.code()} ${treeResponse.message()}")
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFileContent(
        owner: String,
        repo: String,
        path: String,
        branch: String
    ): Result<FileContent> {
        return try {
            val response = gitHubApi.getContents(owner, repo, path, ref = branch)
            if (response.isSuccessful) {
                val contents = response.body()
                val file = contents?.firstOrNull()
                    ?: return Result.failure(Exception("File not found: $path"))

                val decodedContent = file.content?.let { encoded ->
                    val cleaned = encoded.replace("\n", "").replace("\r", "")
                    String(Base64.decode(cleaned, Base64.DEFAULT))
                } ?: return Result.failure(Exception("No content available for: $path"))

                Result.success(
                    FileContent(
                        path = file.path,
                        name = file.name,
                        content = decodedContent,
                        sha = file.sha,
                        size = file.size,
                        encoding = file.encoding
                    )
                )
            } else {
                Result.failure(
                    Exception("Failed to fetch file: ${response.code()} ${response.message()}")
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateFileContent(
        owner: String,
        repo: String,
        path: String,
        content: String,
        sha: String,
        message: String,
        branch: String
    ): UpdateResult {
        return try {
            val encoded = Base64.encodeToString(content.toByteArray(), Base64.NO_WRAP)
            val request = PutContentsRequest(
                message = message,
                content = encoded,
                sha = sha,
                branch = branch
            )
            val response = gitHubApi.putContents(owner, repo, path, request)

            if (response.isSuccessful) {
                val body = response.body()
                UpdateResult(
                    success = true,
                    newSha = body?.content?.sha,
                    commitSha = body?.commit?.sha
                )
            } else if (response.code() == 409) {
                UpdateResult(
                    success = false,
                    newSha = null,
                    commitSha = null,
                    error = "Conflict: file was modified since last fetch. Please refresh and try again.",
                    isConflict = true
                )
            } else {
                UpdateResult(
                    success = false,
                    newSha = null,
                    commitSha = null,
                    error = "Update failed: ${response.code()} ${response.message()}"
                )
            }
        } catch (e: Exception) {
            UpdateResult(
                success = false,
                newSha = null,
                commitSha = null,
                error = e.message ?: "Unknown error"
            )
        }
    }
}
