package com.cherryops.app.data.model

data class Project(
    val id: String,
    val name: String,
    val repoFullName: String,
    val defaultBranch: String,
    val createdAt: String,
    val updatedAt: String
) {
    val owner: String
        get() = repoFullName.substringBefore("/")

    val repoName: String
        get() = repoFullName.substringAfter("/")
}
