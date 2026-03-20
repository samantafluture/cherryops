package com.cherryops.app.feature.review

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.data.model.Task
import com.cherryops.app.data.task.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TaskReviewUiState(
    val isLoading: Boolean = true,
    val task: Task? = null,
    val redirectBrief: String = "",
    val isSubmitting: Boolean = false,
    val reviewComplete: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class TaskReviewViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val taskRepository: TaskRepository
) : ViewModel() {

    val taskId: String = savedStateHandle.get<String>("taskId").orEmpty()

    private val _uiState = MutableStateFlow(TaskReviewUiState())
    val uiState: StateFlow<TaskReviewUiState> = _uiState.asStateFlow()

    init {
        loadTask()
    }

    private fun loadTask() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            taskRepository.getTaskResult(taskId)
                .onSuccess { task ->
                    _uiState.update { it.copy(isLoading = false, task = task) }
                }
                .onFailure { e ->
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

    fun updateRedirectBrief(brief: String) {
        _uiState.update { it.copy(redirectBrief = brief) }
    }

    fun approve() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            taskRepository.approveTask(taskId)
                .onSuccess {
                    _uiState.update { it.copy(isSubmitting = false, reviewComplete = true) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isSubmitting = false, error = e.message ?: "Approve failed")
                    }
                }
        }
    }

    fun redirect() {
        val brief = _uiState.value.redirectBrief
        if (brief.isBlank()) {
            _uiState.update { it.copy(error = "Provide redirect instructions") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            taskRepository.redirectTask(taskId, brief)
                .onSuccess {
                    _uiState.update { it.copy(isSubmitting = false, reviewComplete = true) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isSubmitting = false, error = e.message ?: "Redirect failed")
                    }
                }
        }
    }

    fun discard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            taskRepository.discardTask(taskId)
                .onSuccess {
                    _uiState.update { it.copy(isSubmitting = false, reviewComplete = true) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isSubmitting = false, error = e.message ?: "Discard failed")
                    }
                }
        }
    }
}
