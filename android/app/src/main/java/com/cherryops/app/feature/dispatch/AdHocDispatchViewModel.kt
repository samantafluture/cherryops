package com.cherryops.app.feature.dispatch

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.data.task.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdHocDispatchUiState(
    val brief: String = "",
    val targetPath: String = "",
    val isDispatching: Boolean = false,
    val dispatchedTaskId: String? = null,
    val error: String? = null
)

@HiltViewModel
class AdHocDispatchViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val taskRepository: TaskRepository
) : ViewModel() {

    val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()

    private val _uiState = MutableStateFlow(AdHocDispatchUiState())
    val uiState: StateFlow<AdHocDispatchUiState> = _uiState.asStateFlow()

    fun updateBrief(brief: String) {
        _uiState.update { it.copy(brief = brief, error = null) }
    }

    fun updateTargetPath(path: String) {
        _uiState.update { it.copy(targetPath = path) }
    }

    fun dispatch() {
        val state = _uiState.value
        if (state.brief.isBlank()) {
            _uiState.update { it.copy(error = "Please describe what you want the agent to do") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isDispatching = true, error = null) }
            taskRepository.dispatchTask(
                projectId = projectId,
                brief = state.brief
            ).onSuccess { task ->
                _uiState.update { it.copy(isDispatching = false, dispatchedTaskId = task.id) }
            }.onFailure { e ->
                _uiState.update {
                    it.copy(isDispatching = false, error = e.message ?: "Dispatch failed")
                }
            }
        }
    }
}
