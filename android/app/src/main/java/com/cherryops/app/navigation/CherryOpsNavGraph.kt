package com.cherryops.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.cherryops.app.feature.dispatch.AdHocDispatchScreen
import com.cherryops.app.feature.dispatch.TaskStatusScreen
import com.cherryops.app.feature.files.FileBrowserScreen
import com.cherryops.app.feature.files.FileViewerScreen
import com.cherryops.app.feature.onboarding.BuilderSetupScreen
import com.cherryops.app.feature.onboarding.OperatorSetupScreen
import com.cherryops.app.feature.onboarding.PersonaSelectScreen
import com.cherryops.app.feature.projects.ProjectHomeScreen
import com.cherryops.app.feature.projects.ProjectListScreen
import com.cherryops.app.feature.review.TaskReviewScreen
import com.cherryops.app.feature.settings.SettingsScreen
import com.cherryops.app.feature.skills.SkillDispatchScreen
import com.cherryops.app.feature.skills.SkillGridScreen
import java.net.URLDecoder
import java.net.URLEncoder

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
            PersonaSelectScreen(
                onBuilderSelected = { navController.navigate(Screen.BuilderSetup.route) },
                onOperatorSelected = { navController.navigate(Screen.OperatorSetup.route) }
            )
        }

        composable(Screen.BuilderSetup.route) {
            BuilderSetupScreen(
                onNavigateBack = { navController.popBackStack() },
                onSetupComplete = {
                    navController.navigate(Screen.ProjectList.route) {
                        popUpTo(Screen.PersonaSelect.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.OperatorSetup.route) {
            OperatorSetupScreen(
                onNavigateBack = { navController.popBackStack() },
                onSetupComplete = {
                    navController.navigate(Screen.ProjectList.route) {
                        popUpTo(Screen.PersonaSelect.route) { inclusive = true }
                    }
                }
            )
        }

        // -- Projects --
        composable(Screen.ProjectList.route) {
            ProjectListScreen(
                onProjectSelected = { repoFullName ->
                    val encoded = URLEncoder.encode(repoFullName, "UTF-8")
                    navController.navigate(Screen.ProjectHome.createRoute(encoded))
                },
                onSettingsClick = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(
            route = Screen.ProjectHome.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = URLDecoder.decode(
                backStackEntry.arguments?.getString("projectId").orEmpty(), "UTF-8"
            )
            ProjectHomeScreen(
                projectId = projectId,
                onNavigateBack = { navController.popBackStack() },
                onFileBrowser = {
                    navController.navigate(
                        Screen.FileBrowser.createRoute(URLEncoder.encode(projectId, "UTF-8"))
                    )
                },
                onSkills = {
                    navController.navigate(
                        Screen.SkillGrid.createRoute(URLEncoder.encode(projectId, "UTF-8"))
                    )
                },
                onDispatch = {
                    navController.navigate(
                        Screen.AdHocDispatch.createRoute(URLEncoder.encode(projectId, "UTF-8"))
                    )
                },
                onTaskClick = { taskId ->
                    navController.navigate(Screen.TaskStatus.createRoute(taskId))
                }
            )
        }

        // -- File Browser --
        composable(
            route = Screen.FileBrowser.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = URLDecoder.decode(
                backStackEntry.arguments?.getString("projectId").orEmpty(), "UTF-8"
            )
            FileBrowserScreen(
                projectId = projectId,
                onNavigateBack = { navController.popBackStack() },
                onFileSelected = { path ->
                    val encodedProject = URLEncoder.encode(projectId, "UTF-8")
                    val encodedPath = URLEncoder.encode(path, "UTF-8")
                    navController.navigate(Screen.FileViewer.createRoute(encodedProject, encodedPath))
                }
            )
        }

        composable(
            route = Screen.FileViewer.route,
            arguments = listOf(
                navArgument("projectId") { type = NavType.StringType },
                navArgument("path") { type = NavType.StringType }
            )
        ) {
            FileViewerScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // -- Skills --
        composable(
            route = Screen.SkillGrid.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = URLDecoder.decode(
                backStackEntry.arguments?.getString("projectId").orEmpty(), "UTF-8"
            )
            SkillGridScreen(
                projectId = projectId,
                onNavigateBack = { navController.popBackStack() },
                onSkillSelected = { skillId ->
                    val encodedProject = URLEncoder.encode(projectId, "UTF-8")
                    navController.navigate(Screen.SkillDispatch.createRoute(encodedProject, skillId))
                }
            )
        }

        composable(
            route = Screen.SkillDispatch.route,
            arguments = listOf(
                navArgument("projectId") { type = NavType.StringType },
                navArgument("skillId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val projectId = URLDecoder.decode(
                backStackEntry.arguments?.getString("projectId").orEmpty(), "UTF-8"
            )
            SkillDispatchScreen(
                projectId = projectId,
                onNavigateBack = { navController.popBackStack() },
                onTaskDispatched = { taskId ->
                    navController.navigate(Screen.TaskStatus.createRoute(taskId)) {
                        popUpTo(Screen.SkillGrid.createRoute(
                            URLEncoder.encode(projectId, "UTF-8")
                        ))
                    }
                }
            )
        }

        // -- Dispatch --
        composable(
            route = Screen.AdHocDispatch.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = URLDecoder.decode(
                backStackEntry.arguments?.getString("projectId").orEmpty(), "UTF-8"
            )
            AdHocDispatchScreen(
                projectId = projectId,
                onNavigateBack = { navController.popBackStack() },
                onTaskDispatched = { taskId ->
                    navController.navigate(Screen.TaskStatus.createRoute(taskId)) {
                        popUpTo(Screen.ProjectHome.createRoute(
                            URLEncoder.encode(projectId, "UTF-8")
                        ))
                    }
                }
            )
        }

        // -- Tasks --
        composable(
            route = Screen.TaskStatus.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId").orEmpty()
            TaskStatusScreen(
                taskId = taskId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToReview = { id ->
                    navController.navigate(Screen.TaskReview.createRoute(id))
                }
            )
        }

        composable(
            route = Screen.TaskReview.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId").orEmpty()
            TaskReviewScreen(
                taskId = taskId,
                onNavigateBack = { navController.popBackStack() },
                onReviewComplete = {
                    navController.popBackStack(Screen.ProjectList.route, false)
                }
            )
        }

        // -- Settings --
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.PersonaSelect.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
