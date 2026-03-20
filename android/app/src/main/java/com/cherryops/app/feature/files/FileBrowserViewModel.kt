package com.cherryops.app.feature.files

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.data.github.FileNode
import com.cherryops.app.data.github.FileNodeType
import com.cherryops.app.data.github.GitHubRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FileBrowserUiState(
    val isLoading: Boolean = true,
    val fileTree: List<FileNode> = emptyList(),
    val expandedPaths: Set<String> = emptySet(),
    val currentPath: List<String> = emptyList(), // breadcrumb
    val error: String? = null
)

@HiltViewModel
class FileBrowserViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val gitHubRepository: GitHubRepository
) : ViewModel() {

    private val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()
    private val owner: String = projectId.substringBefore("/")
    private val repo: String = projectId.substringAfter("/")

    private val _uiState = MutableStateFlow(FileBrowserUiState())
    val uiState: StateFlow<FileBrowserUiState> = _uiState.asStateFlow()

    init {
        loadFileTree()
    }

    fun loadFileTree(branch: String = "main") {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            gitHubRepository.fetchFileTree(owner, repo, branch)
                .onSuccess { nodes ->
                    _uiState.update {
                        it.copy(isLoading = false, fileTree = nodes)
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.message ?: "Failed to load files")
                    }
                }
        }
    }

    fun toggleExpand(path: String) {
        _uiState.update { state ->
            val expanded = state.expandedPaths.toMutableSet()
            if (expanded.contains(path)) expanded.remove(path) else expanded.add(path)
            state.copy(expandedPaths = expanded)
        }
    }

    fun navigateToDirectory(pathParts: List<String>) {
        _uiState.update { it.copy(currentPath = pathParts) }
    }

    fun navigateUp() {
        _uiState.update {
            it.copy(currentPath = it.currentPath.dropLast(1))
        }
    }

    fun getVisibleNodes(): List<Pair<FileNode, Int>> {
        val state = _uiState.value
        val result = mutableListOf<Pair<FileNode, Int>>()
        fun walk(nodes: List<FileNode>, depth: Int) {
            for (node in nodes) {
                result.add(node to depth)
                if (node.type == FileNodeType.DIRECTORY && state.expandedPaths.contains(node.path)) {
                    walk(node.children, depth + 1)
                }
            }
        }
        walk(state.fileTree, 0)
        return result
    }
}
