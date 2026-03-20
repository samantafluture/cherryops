package com.cherryops.app.navigation

sealed class Screen(val route: String) {

    // Onboarding
    data object PersonaSelect : Screen("onboarding/persona-select")
    data object BuilderSetup : Screen("onboarding/builder-setup")
    data object OperatorSetup : Screen("onboarding/operator-setup")

    // Projects
    data object ProjectList : Screen("projects")
    data object ProjectHome : Screen("project/{projectId}") {
        fun createRoute(projectId: String): String = "project/$projectId"
    }

    // File Browser
    data object FileBrowser : Screen("project/{projectId}/files") {
        fun createRoute(projectId: String): String = "project/$projectId/files"
    }
    data object FileViewer : Screen("project/{projectId}/file/{path}") {
        fun createRoute(projectId: String, path: String): String =
            "project/$projectId/file/$path"
    }

    // Skills
    data object SkillGrid : Screen("project/{projectId}/skills") {
        fun createRoute(projectId: String): String = "project/$projectId/skills"
    }
    data object SkillDispatch : Screen("project/{projectId}/skill/{skillId}") {
        fun createRoute(projectId: String, skillId: String): String =
            "project/$projectId/skill/$skillId"
    }

    // Dispatch
    data object AdHocDispatch : Screen("dispatch/{projectId}") {
        fun createRoute(projectId: String): String = "dispatch/$projectId"
    }
    data object VoiceCapture : Screen("dispatch/{projectId}/voice") {
        fun createRoute(projectId: String): String = "dispatch/$projectId/voice"
    }

    // Tasks
    data object TaskStatus : Screen("task/{taskId}/status") {
        fun createRoute(taskId: String): String = "task/$taskId/status"
    }
    data object TaskReview : Screen("task/{taskId}/review") {
        fun createRoute(taskId: String): String = "task/$taskId/review"
    }

    // Settings
    data object Settings : Screen("settings")
}
