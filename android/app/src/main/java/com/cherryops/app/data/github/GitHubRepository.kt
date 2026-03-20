package com.cherryops.app.data.github

import android.util.Base64
import com.cherryops.app.core.network.GitHubApiService
import com.cherryops.app.core.network.PutContentsRequest
import com.cherryops.app.core.storage.CachedFileDao
import com.cherryops.app.core.storage.CachedFileEntity
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GitHubRepository @Inject constructor(
    private val gitHubApi: GitHubApiService,
    private val cachedFileDao: CachedFileDao
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

                // Cache the tree for offline access
                cacheFileTree(owner, repo, branch, nodes)

                Result.success(nodes)
            } else {
                // Try offline cache on network failure
                val cached = getCachedFileTree(owner, repo, branch)
                if (cached.isNotEmpty()) {
                    Result.success(cached)
                } else {
                    Result.failure(
                        Exception("Failed to fetch tree: ${treeResponse.code()} ${treeResponse.message()}")
                    )
                }
            }
        } catch (e: Exception) {
            // Try offline cache
            val cached = getCachedFileTree(owner, repo, branch)
            if (cached.isNotEmpty()) {
                Result.success(cached)
            } else {
                Result.failure(e)
            }
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

                val fileContent = FileContent(
                    path = file.path,
                    name = file.name,
                    content = decodedContent,
                    sha = file.sha,
                    size = file.size,
                    encoding = file.encoding
                )

                // Cache for offline
                cacheFileContent(owner, repo, branch, fileContent)

                Result.success(fileContent)
            } else {
                // Try cache
                val cached = getCachedFileContent(owner, repo, branch, path)
                if (cached != null) {
                    Result.success(cached)
                } else {
                    Result.failure(
                        Exception("Failed to fetch file: ${response.code()} ${response.message()}")
                    )
                }
            }
        } catch (e: Exception) {
            val cached = getCachedFileContent(owner, repo, branch, path)
            if (cached != null) {
                Result.success(cached)
            } else {
                Result.failure(e)
            }
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

    // -- Offline cache helpers --

    private fun repoPrefix(owner: String, repo: String, branch: String) =
        "$owner/$repo:$branch"

    private suspend fun cacheFileTree(
        owner: String,
        repo: String,
        branch: String,
        nodes: List<FileNode>
    ) {
        val prefix = repoPrefix(owner, repo, branch)
        val entities = mutableListOf<CachedFileEntity>()
        fun flatten(nodeList: List<FileNode>, parent: String) {
            for (node in nodeList) {
                entities.add(
                    CachedFileEntity(
                        cacheKey = "$prefix:${node.path}",
                        name = node.name,
                        path = node.path,
                        content = null,
                        sha = node.sha,
                        size = node.size ?: 0,
                        isDirectory = node.type == FileNodeType.DIRECTORY,
                        parentPath = parent
                    )
                )
                if (node.type == FileNodeType.DIRECTORY) {
                    flatten(node.children, node.path)
                }
            }
        }
        flatten(nodes, "")
        cachedFileDao.clearRepo(prefix)
        cachedFileDao.insertFiles(entities)
    }

    private suspend fun getCachedFileTree(
        owner: String,
        repo: String,
        branch: String
    ): List<FileNode> {
        val prefix = repoPrefix(owner, repo, branch)
        val roots = cachedFileDao.getChildren(prefix, "")
        if (roots.isEmpty()) return emptyList()
        return buildTreeFromCache(prefix, roots)
    }

    private suspend fun buildTreeFromCache(
        prefix: String,
        entities: List<CachedFileEntity>
    ): List<FileNode> {
        return entities.map { entity ->
            val children = if (entity.isDirectory) {
                val childEntities = cachedFileDao.getChildren(prefix, entity.path)
                buildTreeFromCache(prefix, childEntities)
            } else {
                emptyList()
            }
            FileNode(
                path = entity.path,
                name = entity.name,
                type = if (entity.isDirectory) FileNodeType.DIRECTORY else FileNodeType.FILE,
                sha = entity.sha,
                size = entity.size,
                children = children,
                isExpanded = false
            )
        }
    }

    private suspend fun cacheFileContent(
        owner: String,
        repo: String,
        branch: String,
        fileContent: FileContent
    ) {
        val prefix = repoPrefix(owner, repo, branch)
        cachedFileDao.insertFile(
            CachedFileEntity(
                cacheKey = "$prefix:${fileContent.path}",
                name = fileContent.name,
                path = fileContent.path,
                content = fileContent.content,
                sha = fileContent.sha,
                size = fileContent.size,
                isDirectory = false,
                parentPath = fileContent.path.substringBeforeLast("/", "")
            )
        )
    }

    private suspend fun getCachedFileContent(
        owner: String,
        repo: String,
        branch: String,
        path: String
    ): FileContent? {
        val prefix = repoPrefix(owner, repo, branch)
        val cached = cachedFileDao.getFile("$prefix:$path") ?: return null
        if (cached.content == null) return null
        return FileContent(
            path = cached.path,
            name = cached.name,
            content = cached.content,
            sha = cached.sha,
            size = cached.size,
            encoding = null
        )
    }
}
