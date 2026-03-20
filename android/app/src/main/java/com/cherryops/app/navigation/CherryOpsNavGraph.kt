package com.cherryops.app.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument

@Composable
fun CherryOpsNavGraph(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.PersonaSelect.route
    ) {
        // -- Onboarding --
        composable(Screen.PersonaSelect.route) {
            PlaceholderScreen("Persona Select")
        }

        composable(Screen.BuilderSetup.route) {
            PlaceholderScreen("Builder Setup")
        }

        composable(Screen.OperatorSetup.route) {
            PlaceholderScreen("Operator Setup")
        }

        // -- Projects --
        composable(Screen.ProjectList.route) {
            PlaceholderScreen("Projects")
        }

        composable(
            route = Screen.ProjectHome.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId").orEmpty()
            PlaceholderScreen("Project Home: $projectId")
        }

        // -- File Browser --
        composable(
            route = Screen.FileBrowser.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId").orEmpty()
            PlaceholderScreen("File Browser: $projectId")
        }

        composable(
            route = Screen.FileViewer.route,
            arguments = listOf(
                navArgument("projectId") { type = NavType.StringType },
                navArgument("path") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId").orEmpty()
            val path = backStackEntry.arguments?.getString("path").orEmpty()
            PlaceholderScreen("File Viewer: $projectId / $path")
        }

        // -- Skills --
        composable(
            route = Screen.SkillGrid.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId").orEmpty()
            PlaceholderScreen("Skills: $projectId")
        }

        composable(
            route = Screen.SkillDispatch.route,
            arguments = listOf(
                navArgument("projectId") { type = NavType.StringType },
                navArgument("skillId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId").orEmpty()
            val skillId = backStackEntry.arguments?.getString("skillId").orEmpty()
            PlaceholderScreen("Skill Dispatch: $projectId / $skillId")
        }

        // -- Dispatch --
        composable(
            route = Screen.AdHocDispatch.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId").orEmpty()
            PlaceholderScreen("Ad-hoc Dispatch: $projectId")
        }

        // -- Tasks --
        composable(
            route = Screen.TaskStatus.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId").orEmpty()
            PlaceholderScreen("Task Status: $taskId")
        }

        composable(
            route = Screen.TaskReview.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId").orEmpty()
            PlaceholderScreen("Task Review: $taskId")
        }

        // -- Settings --
        composable(Screen.Settings.route) {
            PlaceholderScreen("Settings")
        }
    }
}

@Composable
private fun PlaceholderScreen(title: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}
