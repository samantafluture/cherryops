package com.cherryops.app.core.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Cherry300,
    onPrimary = Cherry900,
    primaryContainer = Cherry700,
    onPrimaryContainer = Cherry50,
    secondary = Rose300,
    onSecondary = Neutral10,
    secondaryContainer = Rose500,
    onSecondaryContainer = Neutral99,
    tertiary = WarmPink300,
    onTertiary = Neutral10,
    tertiaryContainer = WarmPink500,
    onTertiaryContainer = Neutral99,
    background = SurfaceDark,
    onBackground = OnSurfaceDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    error = StatusError,
    onError = Neutral99
)

private val LightColorScheme = lightColorScheme(
    primary = Cherry600,
    onPrimary = Neutral99,
    primaryContainer = Cherry100,
    onPrimaryContainer = Cherry900,
    secondary = Rose500,
    onSecondary = Neutral99,
    secondaryContainer = Cherry50,
    onSecondaryContainer = Rose500,
    tertiary = WarmPink400,
    onTertiary = Neutral99,
    tertiaryContainer = WarmPink300,
    onTertiaryContainer = Neutral10,
    background = SurfaceLight,
    onBackground = OnSurfaceLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    error = StatusError,
    onError = Neutral99
)

@Composable
fun CherryOpsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = CherryOpsTypography,
        content = content
    )
}
