package com.cherryops.app.feature.projects

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.core.network.GitHubApiService
import com.cherryops.app.core.network.GitHubRepo
import com.cherryops.app.data.model.Project
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProjectListUiState(
    val isLoading: Boolean = true,
    val isLoadingMore: Boolean = false,
    val projects: List<Project> = emptyList(),
    val hasMore: Boolean = true,
    val currentPage: Int = 1,
    val error: String? = null
)

@HiltViewModel
class ProjectListViewModel @Inject constructor(
    private val gitHubApi: GitHubApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProjectListUiState())
    val uiState: StateFlow<ProjectListUiState> = _uiState.asStateFlow()

    companion object {
        private const val PAGE_SIZE = 30
    }

    init {
        loadProjects()
    }

    fun loadProjects() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, currentPage = 1, projects = emptyList()) }
            try {
                val response = gitHubApi.listRepos(perPage = PAGE_SIZE, page = 1, sort = "updated")
                if (response.isSuccessful) {
                    val repos = response.body() ?: emptyList()
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            projects = repos.map { r -> r.toProject() },
                            hasMore = repos.size >= PAGE_SIZE,
                            currentPage = 1
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load repos: ${response.code()}")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Failed to load repos")
                }
            }
        }
    }

    fun loadMore() {
        val state = _uiState.value
        if (state.isLoadingMore || !state.hasMore) return

        viewModelScope.launch {
            val nextPage = state.currentPage + 1
            _uiState.update { it.copy(isLoadingMore = true) }
            try {
                val response = gitHubApi.listRepos(perPage = PAGE_SIZE, page = nextPage, sort = "updated")
                if (response.isSuccessful) {
                    val repos = response.body() ?: emptyList()
                    _uiState.update {
                        it.copy(
                            isLoadingMore = false,
                            projects = it.projects + repos.map { r -> r.toProject() },
                            hasMore = repos.size >= PAGE_SIZE,
                            currentPage = nextPage
                        )
                    }
                } else {
                    _uiState.update { it.copy(isLoadingMore = false) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoadingMore = false) }
            }
        }
    }

    private fun GitHubRepo.toProject() = Project(
        id = full_name,
        name = name,
        repoFullName = full_name,
        defaultBranch = default_branch,
        createdAt = "",
        updatedAt = ""
    )
}
