package com.cherryops.app.feature.review

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Redo
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cherryops.app.core.ui.theme.StatusError
import com.cherryops.app.core.ui.theme.StatusSuccess
import dev.jeziellago.compose.markdowntext.MarkdownText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskReviewScreen(
    taskId: String,
    onNavigateBack: () -> Unit,
    onReviewComplete: () -> Unit,
    viewModel: TaskReviewViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showRedirectField by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.reviewComplete) {
        if (uiState.reviewComplete) onReviewComplete()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Review Output") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }
            uiState.task != null -> {
                val task = uiState.task!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Output summary
                    task.output?.summary?.let { summary ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Agent Output", style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.height(12.dp))
                                MarkdownText(
                                    markdown = summary,
                                    modifier = Modifier.fillMaxWidth(),
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }

                    // Files changed
                    task.output?.filesChanged?.let { files ->
                        if (files.isNotEmpty()) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        "Files Changed (${files.size})",
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    files.forEach { file ->
                                        Text(
                                            text = file,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.padding(vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // PR link
                    task.output?.prUrl?.let { prUrl ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Pull Request", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    prUrl,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    // Redirect field
                    if (showRedirectField) {
                        OutlinedTextField(
                            value = uiState.redirectBrief,
                            onValueChange = { viewModel.updateRedirectBrief(it) },
                            label = { Text("Redirect instructions") },
                            placeholder = { Text("Tell the agent what to change...") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            maxLines = 6
                        )
                    }

                    // Error
                    if (uiState.error != null) {
                        Text(
                            uiState.error!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    // Action buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Approve
                        Button(
                            onClick = { viewModel.approve() },
                            enabled = !uiState.isSubmitting,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = StatusSuccess)
                        ) {
                            if (uiState.isSubmitting) {
                                CircularProgressIndicator(
                                    Modifier.size(16.dp), strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            } else {
                                Icon(Icons.Default.CheckCircle, null, Modifier.size(16.dp))
                                Spacer(Modifier.size(4.dp))
                                Text("Approve")
                            }
                        }

                        // Redirect
                        OutlinedButton(
                            onClick = {
                                if (showRedirectField) viewModel.redirect()
                                else showRedirectField = true
                            },
                            enabled = !uiState.isSubmitting,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Redo, null, Modifier.size(16.dp))
                            Spacer(Modifier.size(4.dp))
                            Text("Redirect")
                        }
                    }

                    // Discard
                    OutlinedButton(
                        onClick = { viewModel.discard() },
                        enabled = !uiState.isSubmitting,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = StatusError
                        )
                    ) {
                        Icon(Icons.Default.Close, null, Modifier.size(16.dp))
                        Spacer(Modifier.size(4.dp))
                        Text("Discard")
                    }
                }
            }
            uiState.error != null -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(uiState.error!!, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
