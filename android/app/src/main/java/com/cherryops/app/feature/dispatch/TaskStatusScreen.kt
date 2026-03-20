package com.cherryops.app.feature.dispatch

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.RateReview
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cherryops.app.core.ui.theme.StatusError
import com.cherryops.app.core.ui.theme.StatusPending
import com.cherryops.app.core.ui.theme.StatusSuccess
import com.cherryops.app.core.ui.theme.StatusWarning
import com.cherryops.app.data.model.TaskStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskStatusScreen(
    taskId: String,
    onNavigateBack: () -> Unit,
    onNavigateToReview: (String) -> Unit,
    viewModel: TaskStatusViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Task Status") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, "Refresh")
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
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Status icon + label
                    val statusColor by animateColorAsState(
                        targetValue = statusColor(task.status),
                        label = "statusColor"
                    )

                    Icon(
                        imageVector = statusIcon(task.status),
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = statusColor
                    )

                    Text(
                        text = statusLabel(task.status),
                        style = MaterialTheme.typography.headlineSmall,
                        color = statusColor
                    )

                    if (uiState.isPolling && !uiState.isTerminal) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                "Polling for updates...",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Task details card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            DetailRow("Task ID", task.id.take(8) + "...")
                            DetailRow("Skill", task.skillId.ifEmpty { "Ad-hoc" })
                            DetailRow("Created", task.createdAt)
                            if (task.output?.filesChanged != null) {
                                DetailRow("Files changed", task.output.filesChanged.size.toString())
                            }
                        }
                    }

                    // Output summary
                    task.output?.summary?.let { summary ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Summary", style = MaterialTheme.typography.titleSmall)
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    summary,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    Spacer(Modifier.weight(1f))

                    // Review button
                    if (task.status == TaskStatus.AWAITING_REVIEW) {
                        Button(
                            onClick = { onNavigateToReview(task.id) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.RateReview, null, Modifier.size(18.dp))
                            Spacer(Modifier.size(8.dp))
                            Text("Review Output")
                        }
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

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodySmall)
    }
}

private fun statusIcon(status: TaskStatus): ImageVector = when (status) {
    TaskStatus.QUEUED -> Icons.Default.HourglassTop
    TaskStatus.RUNNING -> Icons.Default.PlayCircle
    TaskStatus.AWAITING_REVIEW -> Icons.Default.RateReview
    TaskStatus.APPROVED, TaskStatus.COMPLETED -> Icons.Default.CheckCircle
    TaskStatus.REJECTED, TaskStatus.FAILED -> Icons.Default.Error
}

private fun statusColor(status: TaskStatus) = when (status) {
    TaskStatus.QUEUED -> StatusPending
    TaskStatus.RUNNING -> StatusWarning
    TaskStatus.AWAITING_REVIEW -> StatusWarning
    TaskStatus.APPROVED, TaskStatus.COMPLETED -> StatusSuccess
    TaskStatus.REJECTED, TaskStatus.FAILED -> StatusError
}

private fun statusLabel(status: TaskStatus): String = when (status) {
    TaskStatus.QUEUED -> "Queued"
    TaskStatus.RUNNING -> "Running"
    TaskStatus.AWAITING_REVIEW -> "Awaiting Review"
    TaskStatus.APPROVED -> "Approved"
    TaskStatus.REJECTED -> "Rejected"
    TaskStatus.COMPLETED -> "Completed"
    TaskStatus.FAILED -> "Failed"
}
