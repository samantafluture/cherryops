package com.cherryops.app.data.github

data class FileNode(
    val path: String,
    val name: String,
    val type: FileNodeType,
    val sha: String,
    val size: Long?,
    val children: List<FileNode> = emptyList(),
    val isExpanded: Boolean = false
)

enum class FileNodeType {
    FILE,
    DIRECTORY;

    companion object {
        fun fromGitHubType(type: String): FileNodeType = when (type) {
            "tree", "dir" -> DIRECTORY
            else -> FILE
        }
    }
}

data class FileContent(
    val path: String,
    val name: String,
    val content: String,
    val sha: String,
    val size: Long,
    val encoding: String?
)

data class UpdateResult(
    val success: Boolean,
    val newSha: String?,
    val commitSha: String?,
    val error: String? = null,
    val isConflict: Boolean = false
)
