package com.cherryops.app.data.github

import com.cherryops.app.core.network.GitHubTreeEntry

object FileTreeParser {

    /**
     * Converts a flat list of GitHub tree entries into a nested FileNode tree.
     * GitHub returns flat paths like "src/main/App.kt" which need to be
     * organized into a directory hierarchy.
     */
    fun parse(entries: List<GitHubTreeEntry>): List<FileNode> {
        val root = MutableNode(name = "", path = "", type = FileNodeType.DIRECTORY, sha = "", size = null)

        for (entry in entries) {
            val parts = entry.path.split("/")
            var current = root

            for ((index, part) in parts.withIndex()) {
                val isLast = index == parts.lastIndex
                val partPath = parts.subList(0, index + 1).joinToString("/")

                if (isLast) {
                    val type = FileNodeType.fromGitHubType(entry.type)
                    current.children.getOrPut(part) {
                        MutableNode(
                            name = part,
                            path = partPath,
                            type = type,
                            sha = entry.sha,
                            size = entry.size
                        )
                    }
                } else {
                    current = current.children.getOrPut(part) {
                        MutableNode(
                            name = part,
                            path = partPath,
                            type = FileNodeType.DIRECTORY,
                            sha = "",
                            size = null
                        )
                    }
                }
            }
        }

        return root.toFileNodes()
    }

    private class MutableNode(
        val name: String,
        val path: String,
        val type: FileNodeType,
        val sha: String,
        val size: Long?,
        val children: MutableMap<String, MutableNode> = mutableMapOf()
    )

    private fun MutableNode.toFileNodes(): List<FileNode> {
        return children.values
            .map { node ->
                FileNode(
                    path = node.path,
                    name = node.name,
                    type = node.type,
                    sha = node.sha,
                    size = node.size,
                    children = if (node.type == FileNodeType.DIRECTORY) node.toFileNodes() else emptyList(),
                    isExpanded = false
                )
            }
            .sortedWith(compareBy<FileNode> { it.type != FileNodeType.DIRECTORY }.thenBy { it.name.lowercase() })
    }
}
