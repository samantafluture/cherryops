package com.cherryops.app.feature.projects

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.core.network.BackendApiService
import com.cherryops.app.core.network.TaskResponse
import com.cherryops.app.data.model.Task
import com.cherryops.app.data.model.TaskOutput
import com.cherryops.app.data.model.TaskStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProjectHomeUiState(
    val isLoading: Boolean = true,
    val recentTasks: List<Task> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class ProjectHomeViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val backendApi: BackendApiService
) : ViewModel() {

    val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()
    val projectName: String = projectId.substringAfter("/")

    private val _uiState = MutableStateFlow(ProjectHomeUiState())
    val uiState: StateFlow<ProjectHomeUiState> = _uiState.asStateFlow()

    init {
        loadRecentTasks()
    }

    fun loadRecentTasks() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = backendApi.listTasks(projectId = projectId)
                if (response.isSuccessful) {
                    val tasks = response.body()?.map { it.toDomain() } ?: emptyList()
                    _uiState.update { it.copy(isLoading = false, recentTasks = tasks) }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = "Failed to load tasks") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun TaskResponse.toDomain() = Task(
        id = id, projectId = projectId, skillId = skillId,
        status = TaskStatus.fromValue(status), inputs = inputs,
        output = output?.let { TaskOutput(it.summary, it.filesChanged, it.prUrl, it.logs) },
        createdAt = createdAt, updatedAt = updatedAt
    )
}
