package com.cherryops.app.core.storage

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "cherryops_preferences"
)

@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {

    @Provides
    @Singleton
    fun provideDataStore(
        @ApplicationContext context: Context
    ): DataStore<Preferences> = context.dataStore

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): CherryOpsDatabase =
        Room.databaseBuilder(
            context,
            CherryOpsDatabase::class.java,
            CherryOpsDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    @Singleton
    fun provideTaskDao(database: CherryOpsDatabase): TaskDao =
        database.taskDao()

    @Provides
    @Singleton
    fun provideCachedFileDao(database: CherryOpsDatabase): CachedFileDao =
        database.cachedFileDao()

    @Provides
    @Singleton
    fun provideGson(): Gson = Gson()
}

object PreferencesKeys {
    val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
    val SELECTED_PERSONA = stringPreferencesKey("selected_persona")
    val DARK_MODE = booleanPreferencesKey("dark_mode")
    val FCM_TOKEN = stringPreferencesKey("fcm_token")
}
