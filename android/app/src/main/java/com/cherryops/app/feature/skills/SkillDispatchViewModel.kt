package com.cherryops.app.feature.skills

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.core.network.BackendApiService
import com.cherryops.app.core.network.DispatchTaskRequest
import com.cherryops.app.core.network.SkillInputResponse
import com.cherryops.app.core.network.SkillResponse
import com.cherryops.app.data.model.Skill
import com.cherryops.app.data.model.SkillCategory
import com.cherryops.app.data.model.SkillInput
import com.cherryops.app.data.model.SkillInputType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SkillDispatchUiState(
    val isLoading: Boolean = true,
    val skill: Skill? = null,
    val inputValues: Map<String, String> = emptyMap(),
    val isDispatching: Boolean = false,
    val dispatchedTaskId: String? = null,
    val error: String? = null
)

@HiltViewModel
class SkillDispatchViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val backendApi: BackendApiService
) : ViewModel() {

    val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()
    private val skillId: String = savedStateHandle.get<String>("skillId").orEmpty()

    private val _uiState = MutableStateFlow(SkillDispatchUiState())
    val uiState: StateFlow<SkillDispatchUiState> = _uiState.asStateFlow()

    init {
        loadSkill()
    }

    private fun loadSkill() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = backendApi.getSkill(skillId)
                if (response.isSuccessful) {
                    val skill = response.body()?.toDomain()
                    val defaults = skill?.inputs
                        ?.filter { it.defaultValue != null }
                        ?.associate { it.name to it.defaultValue!! }
                        ?: emptyMap()
                    _uiState.update {
                        it.copy(isLoading = false, skill = skill, inputValues = defaults)
                    }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load skill")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Failed to load skill")
                }
            }
        }
    }

    fun updateInput(name: String, value: String) {
        _uiState.update { state ->
            state.copy(inputValues = state.inputValues + (name to value))
        }
    }

    fun dispatch() {
        val state = _uiState.value
        val skill = state.skill ?: return

        // Validate required inputs
        val missingRequired = skill.inputs
            .filter { it.required }
            .filter { state.inputValues[it.name].isNullOrBlank() }
        if (missingRequired.isNotEmpty()) {
            _uiState.update {
                it.copy(error = "Missing required fields: ${missingRequired.joinToString { f -> f.name }}")
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isDispatching = true, error = null) }
            try {
                val request = DispatchTaskRequest(
                    projectId = projectId,
                    skillId = skillId,
                    inputs = state.inputValues
                )
                val response = backendApi.dispatchTask(request)
                if (response.isSuccessful) {
                    val taskId = response.body()?.id
                    _uiState.update {
                        it.copy(isDispatching = false, dispatchedTaskId = taskId)
                    }
                } else {
                    _uiState.update {
                        it.copy(isDispatching = false, error = "Dispatch failed: ${response.code()}")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isDispatching = false, error = e.message ?: "Dispatch failed")
                }
            }
        }
    }

    private fun SkillResponse.toDomain() = Skill(
        id = id, name = name, description = description,
        category = SkillCategory.fromValue(category),
        inputs = inputs.map { it.toDomain() }, version = version
    )

    private fun SkillInputResponse.toDomain() = SkillInput(
        name = name, type = SkillInputType.fromValue(type),
        required = required, description = description, defaultValue = defaultValue
    )
}
