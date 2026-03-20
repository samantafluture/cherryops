package com.cherryops.app.feature.dispatch

import android.util.Base64
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

data class VoiceCaptureUiState(
    val isRecording: Boolean = false,
    val recordingDuration: Int = 0,
    val isTranscribing: Boolean = false,
    val transcript: String = "",
    val isDispatching: Boolean = false,
    val dispatchedTaskId: String? = null,
    val error: String? = null
)

@HiltViewModel
class VoiceCaptureViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val voiceCaptureManager: VoiceCaptureManager,
    private val transcriptionService: TranscriptionService,
    private val taskRepository: TaskRepository
) : ViewModel() {

    val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()

    private val _uiState = MutableStateFlow(VoiceCaptureUiState())
    val uiState: StateFlow<VoiceCaptureUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            voiceCaptureManager.isRecording.collect { recording ->
                _uiState.update { it.copy(isRecording = recording) }
            }
        }
        viewModelScope.launch {
            voiceCaptureManager.recordingDuration.collect { duration ->
                _uiState.update { it.copy(recordingDuration = duration) }
            }
        }
    }

    fun toggleRecording() {
        if (_uiState.value.isRecording) {
            stopAndTranscribe()
        } else {
            startRecording()
        }
    }

    private fun startRecording() {
        _uiState.update { it.copy(error = null) }
        val started = voiceCaptureManager.startRecording()
        if (!started) {
            _uiState.update { it.copy(error = "Failed to start recording. Check microphone permission.") }
        }
    }

    private fun stopAndTranscribe() {
        val audioData = voiceCaptureManager.stopRecording()
        if (audioData == null) {
            _uiState.update { it.copy(error = "No audio recorded") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isTranscribing = true, error = null) }
            transcriptionService.transcribe(audioData)
                .onSuccess { transcript ->
                    _uiState.update { it.copy(isTranscribing = false, transcript = transcript) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isTranscribing = false, error = e.message ?: "Transcription failed")
                    }
                }
        }
    }

    fun updateTranscript(text: String) {
        _uiState.update { it.copy(transcript = text) }
    }

    fun dispatch() {
        val brief = _uiState.value.transcript
        if (brief.isBlank()) {
            _uiState.update { it.copy(error = "Record or type a task description first") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isDispatching = true, error = null) }
            taskRepository.dispatchTask(projectId = projectId, brief = brief)
                .onSuccess { task ->
                    _uiState.update { it.copy(isDispatching = false, dispatchedTaskId = task.id) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isDispatching = false, error = e.message ?: "Dispatch failed")
                    }
                }
        }
    }
}
