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
    val projects: List<Project> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class ProjectListViewModel @Inject constructor(
    private val gitHubApi: GitHubApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProjectListUiState())
    val uiState: StateFlow<ProjectListUiState> = _uiState.asStateFlow()

    init {
        loadProjects()
    }

    fun loadProjects() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = gitHubApi.listRepos(perPage = 50, sort = "updated")
                if (response.isSuccessful) {
                    val projects = response.body()?.map { it.toProject() } ?: emptyList()
                    _uiState.update { it.copy(isLoading = false, projects = projects) }
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

    private fun GitHubRepo.toProject() = Project(
        id = full_name,
        name = name,
        repoFullName = full_name,
        defaultBranch = default_branch,
        createdAt = "",
        updatedAt = ""
    )
}
