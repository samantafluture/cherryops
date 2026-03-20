package com.cherryops.app.feature.dispatch

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.data.model.Task
import com.cherryops.app.data.model.TaskStatus
import com.cherryops.app.data.task.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TaskStatusUiState(
    val isLoading: Boolean = true,
    val task: Task? = null,
    val isPolling: Boolean = false,
    val error: String? = null
) {
    val isTerminal: Boolean
        get() = task?.status in listOf(
            TaskStatus.AWAITING_REVIEW, TaskStatus.COMPLETED,
            TaskStatus.APPROVED, TaskStatus.REJECTED, TaskStatus.FAILED
        )
}

@HiltViewModel
class TaskStatusViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val taskRepository: TaskRepository
) : ViewModel() {

    val taskId: String = savedStateHandle.get<String>("taskId").orEmpty()

    private val _uiState = MutableStateFlow(TaskStatusUiState())
    val uiState: StateFlow<TaskStatusUiState> = _uiState.asStateFlow()

    init {
        loadTask()
        startPolling()
    }

    private fun loadTask() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            taskRepository.getTaskResult(taskId)
                .onSuccess { task ->
                    _uiState.update { it.copy(isLoading = false, task = task) }
                }
                .onFailure { e ->
                    // Try cached
                    val cached = taskRepository.getCachedTask(taskId)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            task = cached,
                            error = if (cached == null) e.message else null
                        )
                    }
                }
        }
    }

    private fun startPolling() {
        viewModelScope.launch {
            _uiState.update { it.copy(isPolling = true) }
            while (true) {
                delay(POLL_INTERVAL_MS)
                val state = _uiState.value
                if (state.isTerminal) {
                    _uiState.update { it.copy(isPolling = false) }
                    break
                }
                taskRepository.getTaskResult(taskId)
                    .onSuccess { task ->
                        _uiState.update { it.copy(task = task) }
                    }
            }
        }
    }

    fun refresh() {
        loadTask()
    }

    companion object {
        private const val POLL_INTERVAL_MS = 5000L
    }
}
