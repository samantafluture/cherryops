package com.cherryops.app.feature.skills

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.core.network.BackendApiService
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

data class SkillGridUiState(
    val isLoading: Boolean = true,
    val skills: List<Skill> = emptyList(),
    val selectedCategory: SkillCategory? = null,
    val error: String? = null
) {
    val filteredSkills: List<Skill>
        get() = if (selectedCategory == null) skills
        else skills.filter { it.category == selectedCategory }

    val categories: List<SkillCategory>
        get() = skills.map { it.category }.distinct().sorted()
}

@HiltViewModel
class SkillGridViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val backendApi: BackendApiService
) : ViewModel() {

    val projectId: String = savedStateHandle.get<String>("projectId").orEmpty()

    private val _uiState = MutableStateFlow(SkillGridUiState())
    val uiState: StateFlow<SkillGridUiState> = _uiState.asStateFlow()

    init {
        loadSkills()
    }

    fun loadSkills() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = backendApi.listSkills()
                if (response.isSuccessful) {
                    val skills = response.body()?.map { it.toDomain() } ?: emptyList()
                    _uiState.update { it.copy(isLoading = false, skills = skills) }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load skills: ${response.code()}")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Failed to load skills")
                }
            }
        }
    }

    fun selectCategory(category: SkillCategory?) {
        _uiState.update { it.copy(selectedCategory = category) }
    }

    private fun SkillResponse.toDomain() = Skill(
        id = id,
        name = name,
        description = description,
        category = SkillCategory.fromValue(category),
        inputs = inputs.map { it.toDomain() },
        version = version
    )

    private fun SkillInputResponse.toDomain() = SkillInput(
        name = name,
        type = SkillInputType.fromValue(type),
        required = required,
        description = description,
        defaultValue = defaultValue
    )
}
