package com.cherryops.app.feature.settings

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
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val persona: String = "",
    val hasGitHubToken: Boolean = false,
    val darkMode: Boolean = false,
    val isLoggingOut: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val dataStore: DataStore<Preferences>,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            val prefs = dataStore.data.first()
            _uiState.update {
                it.copy(
                    persona = prefs[PreferencesKeys.SELECTED_PERSONA] ?: "builder",
                    hasGitHubToken = tokenManager.getGitHubToken() != null,
                    darkMode = prefs[PreferencesKeys.DARK_MODE] ?: false
                )
            }
        }
    }

    fun toggleDarkMode() {
        viewModelScope.launch {
            val newValue = !_uiState.value.darkMode
            dataStore.edit { it[PreferencesKeys.DARK_MODE] = newValue }
            _uiState.update { it.copy(darkMode = newValue) }
        }
    }

    fun logout() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoggingOut = true) }
            tokenManager.clearTokens()
            dataStore.edit { it.clear() }
            _uiState.update { it.copy(isLoggingOut = false) }
        }
    }
}
