package com.cherryops.app.feature.onboarding

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cherryops.app.core.auth.TokenManager
import com.cherryops.app.core.storage.PreferencesKeys
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class Persona(val value: String, val label: String) {
    BUILDER("builder", "Builder"),
    OPERATOR("operator", "Operator")
}

data class OnboardingUiState(
    val selectedPersona: Persona? = null,
    val backendUrl: String = "http://10.0.2.2:3100",
    val githubToken: String = "",
    val isCompleting: Boolean = false,
    val isComplete: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val dataStore: DataStore<Preferences>,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(OnboardingUiState())
    val uiState: StateFlow<OnboardingUiState> = _uiState.asStateFlow()

    init {
        checkOnboardingStatus()
    }

    private fun checkOnboardingStatus() {
        viewModelScope.launch {
            val prefs = dataStore.data.first()
            val completed = prefs[PreferencesKeys.ONBOARDING_COMPLETED] ?: false
            if (completed) {
                _uiState.update { it.copy(isComplete = true) }
            }
        }
    }

    fun selectPersona(persona: Persona) {
        _uiState.update { it.copy(selectedPersona = persona) }
    }

    fun updateBackendUrl(url: String) {
        _uiState.update { it.copy(backendUrl = url) }
    }

    fun updateGitHubToken(token: String) {
        _uiState.update { it.copy(githubToken = token) }
    }

    fun completeOnboarding() {
        val state = _uiState.value
        if (state.selectedPersona == null) {
            _uiState.update { it.copy(error = "Please select a persona") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isCompleting = true, error = null) }

            // Save GitHub token if provided
            if (state.githubToken.isNotBlank()) {
                tokenManager.saveGitHubToken(state.githubToken)
            }

            // Save preferences
            dataStore.edit { prefs ->
                prefs[PreferencesKeys.ONBOARDING_COMPLETED] = true
                prefs[PreferencesKeys.SELECTED_PERSONA] = state.selectedPersona.value
            }

            _uiState.update { it.copy(isCompleting = false, isComplete = true) }
        }
    }
}
