package com.cherryops.app.data.model

data class Skill(
    val id: String,
    val name: String,
    val description: String,
    val category: SkillCategory,
    val inputs: List<SkillInput>,
    val version: String
)

data class SkillInput(
    val name: String,
    val type: SkillInputType,
    val required: Boolean,
    val description: String?,
    val defaultValue: String?
)

enum class SkillCategory(val value: String) {
    CODE_GENERATION("code_generation"),
    CODE_REVIEW("code_review"),
    DOCUMENTATION("documentation"),
    TESTING("testing"),
    REFACTORING("refactoring"),
    DEVOPS("devops"),
    CUSTOM("custom");

    companion object {
        fun fromValue(value: String): SkillCategory =
            entries.firstOrNull { it.value == value } ?: CUSTOM
    }
}

enum class SkillInputType(val value: String) {
    TEXT("text"),
    FILE_PATH("file_path"),
    SELECTION("selection"),
    BOOLEAN("boolean"),
    NUMBER("number");

    companion object {
        fun fromValue(value: String): SkillInputType =
            entries.firstOrNull { it.value == value } ?: TEXT
    }
}
