package com.cherryops.app.data.skill

import com.cherryops.app.data.model.Skill
import com.cherryops.app.data.model.SkillCategory
import com.cherryops.app.data.model.SkillInput
import com.cherryops.app.data.model.SkillInputType

/**
 * Lightweight YAML parser for skill definition files.
 * Handles the structured key-value format used in .cherryops/skills/*.yaml
 */
object SkillParser {

    fun parseSkill(yamlContent: String): Result<Skill> {
        return try {
            val lines = yamlContent.lines()
            val topLevel = parseTopLevel(lines)

            val id = topLevel["id"] ?: return Result.failure(Exception("Missing required field: id"))
            val name = topLevel["name"] ?: return Result.failure(Exception("Missing required field: name"))
            val description = topLevel["description"] ?: ""
            val category = topLevel["category"] ?: "custom"
            val version = topLevel["version"] ?: "1.0"

            val inputs = parseInputs(lines)

            Result.success(
                Skill(
                    id = id,
                    name = name,
                    description = description,
                    category = SkillCategory.fromValue(category),
                    inputs = inputs,
                    version = version
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun parseTopLevel(lines: List<String>): Map<String, String> {
        val result = mutableMapOf<String, String>()
        for (line in lines) {
            val trimmed = line.trimStart()
            if (trimmed.startsWith("-") || trimmed.startsWith("#") || trimmed.isBlank()) continue
            // Only parse top-level (no indentation or single indent for non-list items)
            if (line.startsWith("  ") && !line.startsWith("    ")) continue
            if (line.startsWith("  ")) continue

            val colonIndex = trimmed.indexOf(':')
            if (colonIndex > 0) {
                val key = trimmed.substring(0, colonIndex).trim()
                val value = trimmed.substring(colonIndex + 1).trim()
                    .removeSurrounding("\"")
                    .removeSurrounding("'")
                if (value.isNotEmpty() && key != "inputs") {
                    result[key] = value
                }
            }
        }
        return result
    }

    private fun parseInputs(lines: List<String>): List<SkillInput> {
        val inputs = mutableListOf<SkillInput>()
        var inInputs = false
        var currentInput = mutableMapOf<String, String>()

        for (line in lines) {
            val trimmed = line.trimStart()

            if (trimmed == "inputs:" || trimmed.startsWith("inputs:")) {
                inInputs = true
                continue
            }

            if (inInputs) {
                // A top-level key (no indent) ends the inputs block
                if (!line.startsWith(" ") && !line.startsWith("\t") && trimmed.isNotBlank() && !trimmed.startsWith("#")) {
                    inInputs = false
                    if (currentInput.isNotEmpty()) {
                        buildSkillInput(currentInput)?.let { inputs.add(it) }
                        currentInput = mutableMapOf()
                    }
                    continue
                }

                if (trimmed.startsWith("- ")) {
                    // New list item; save previous
                    if (currentInput.isNotEmpty()) {
                        buildSkillInput(currentInput)?.let { inputs.add(it) }
                    }
                    currentInput = mutableMapOf()
                    // Parse the inline key-value on the dash line
                    val afterDash = trimmed.removePrefix("- ").trim()
                    parseKeyValue(afterDash)?.let { (k, v) -> currentInput[k] = v }
                } else if (trimmed.isNotBlank() && !trimmed.startsWith("#")) {
                    parseKeyValue(trimmed)?.let { (k, v) -> currentInput[k] = v }
                }
            }
        }

        // Capture the last input if we ended inside the block
        if (inInputs && currentInput.isNotEmpty()) {
            buildSkillInput(currentInput)?.let { inputs.add(it) }
        }

        return inputs
    }

    private fun parseKeyValue(text: String): Pair<String, String>? {
        val colonIndex = text.indexOf(':')
        if (colonIndex <= 0) return null
        val key = text.substring(0, colonIndex).trim()
        val value = text.substring(colonIndex + 1).trim()
            .removeSurrounding("\"")
            .removeSurrounding("'")
        return key to value
    }

    private fun buildSkillInput(map: Map<String, String>): SkillInput? {
        val name = map["name"] ?: return null
        return SkillInput(
            name = name,
            type = SkillInputType.fromValue(map["type"] ?: "text"),
            required = map["required"]?.toBooleanStrictOrNull() ?: false,
            description = map["description"],
            defaultValue = map["default"] ?: map["defaultValue"]
        )
    }
}
