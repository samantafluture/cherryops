package com.cherryops.app.feature.files

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.data.github.FileContent
import com.cherryops.app.data.github.GitHubRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FileViewerUiState(
    val isLoading: Boolean = true,
    val fileContent: FileContent? = null,
    val error: String? = null
)

@HiltViewModel
class FileViewerViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val gitHubRepository: GitHubRepository
) : ViewModel() {

    private val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()
    private val filePath: String = savedStateHandle.get<String>("path").orEmpty()
    private val owner: String = projectId.substringBefore("/")
    private val repo: String = projectId.substringAfter("/")

    private val _uiState = MutableStateFlow(FileViewerUiState())
    val uiState: StateFlow<FileViewerUiState> = _uiState.asStateFlow()

    init {
        loadFile()
    }

    fun loadFile(branch: String = "main") {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            gitHubRepository.getFileContent(owner, repo, filePath, branch)
                .onSuccess { content ->
                    _uiState.update { it.copy(isLoading = false, fileContent = content) }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.message ?: "Failed to load file")
                    }
                }
        }
    }

    val isMarkdown: Boolean
        get() = filePath.endsWith(".md")

    val fileName: String
        get() = filePath.substringAfterLast("/")
}
