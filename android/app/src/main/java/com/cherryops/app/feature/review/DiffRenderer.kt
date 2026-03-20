package com.cherryops.app.feature.review

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val DiffAddedBg = Color(0xFF1B3A1B)
private val DiffRemovedBg = Color(0xFF3A1B1B)
private val DiffAddedBgLight = Color(0xFFE6FFE6)
private val DiffRemovedBgLight = Color(0xFFFFE6E6)
private val DiffAddedText = Color(0xFF4CAF50)
private val DiffRemovedText = Color(0xFFEF5350)
private val DiffContextText = Color(0xFF9E9E9E)
private val DiffHeaderBg = Color(0xFF1A237E)
private val DiffHeaderText = Color(0xFF90CAF9)

data class DiffLine(
    val type: DiffLineType,
    val content: String,
    val lineNumber: Int? = null
)

enum class DiffLineType {
    ADDED, REMOVED, CONTEXT, HEADER
}

fun parseDiff(diffText: String): List<DiffLine> {
    val lines = diffText.lines()
    val result = mutableListOf<DiffLine>()
    var lineNum = 0

    for (line in lines) {
        when {
            line.startsWith("@@") -> {
                // Parse hunk header for line numbers
                val match = Regex("""@@ -\d+(?:,\d+)? \+(\d+)""").find(line)
                lineNum = match?.groupValues?.get(1)?.toIntOrNull() ?: 0
                result.add(DiffLine(DiffLineType.HEADER, line))
            }
            line.startsWith("+++") || line.startsWith("---") -> {
                result.add(DiffLine(DiffLineType.HEADER, line))
            }
            line.startsWith("+") -> {
                result.add(DiffLine(DiffLineType.ADDED, line.substring(1), lineNum++))
            }
            line.startsWith("-") -> {
                result.add(DiffLine(DiffLineType.REMOVED, line.substring(1)))
            }
            else -> {
                result.add(DiffLine(DiffLineType.CONTEXT, line.removePrefix(" "), lineNum++))
            }
        }
    }

    return result
}

@Composable
fun DiffRenderer(
    diffText: String,
    modifier: Modifier = Modifier,
    isDarkTheme: Boolean = true
) {
    val lines = parseDiff(diffText)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .horizontalScroll(rememberScrollState())
    ) {
        lines.forEach { line ->
            val bgColor = when (line.type) {
                DiffLineType.ADDED -> if (isDarkTheme) DiffAddedBg else DiffAddedBgLight
                DiffLineType.REMOVED -> if (isDarkTheme) DiffRemovedBg else DiffRemovedBgLight
                DiffLineType.HEADER -> DiffHeaderBg.copy(alpha = 0.3f)
                DiffLineType.CONTEXT -> Color.Transparent
            }

            val textColor = when (line.type) {
                DiffLineType.ADDED -> DiffAddedText
                DiffLineType.REMOVED -> DiffRemovedText
                DiffLineType.HEADER -> DiffHeaderText
                DiffLineType.CONTEXT -> DiffContextText
            }

            val prefix = when (line.type) {
                DiffLineType.ADDED -> "+"
                DiffLineType.REMOVED -> "-"
                DiffLineType.HEADER -> ""
                DiffLineType.CONTEXT -> " "
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(bgColor)
                    .padding(horizontal = 8.dp, vertical = 1.dp)
            ) {
                // Line number gutter
                if (line.type != DiffLineType.HEADER) {
                    Text(
                        text = line.lineNumber?.toString()?.padStart(4) ?: "    ",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        color = DiffContextText.copy(alpha = 0.5f),
                        modifier = Modifier.width(40.dp)
                    )
                }

                Text(
                    text = "$prefix${line.content}",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = textColor
                )
            }
        }
    }
}
