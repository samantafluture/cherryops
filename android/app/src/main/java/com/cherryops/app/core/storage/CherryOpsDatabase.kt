package com.cherryops.app.core.storage

import androidx.room.Database
import androidx.room.RoomDatabase
import com.cherryops.app.data.model.TaskEntity

@Database(
    entities = [TaskEntity::class],
    version = 1,
    exportSchema = true
)
abstract class CherryOpsDatabase : RoomDatabase() {

    abstract fun taskDao(): TaskDao

    companion object {
        const val DATABASE_NAME = "cherryops_db"
    }
}

@androidx.room.Dao
interface TaskDao {

    @androidx.room.Query("SELECT * FROM tasks ORDER BY updatedAt DESC")
    suspend fun getAllTasks(): List<TaskEntity>

    @androidx.room.Query("SELECT * FROM tasks WHERE id = :taskId")
    suspend fun getTaskById(taskId: String): TaskEntity?

    @androidx.room.Query("SELECT * FROM tasks WHERE projectId = :projectId ORDER BY updatedAt DESC")
    suspend fun getTasksByProject(projectId: String): List<TaskEntity>

    @androidx.room.Insert(onConflict = androidx.room.OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @androidx.room.Insert(onConflict = androidx.room.OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)

    @androidx.room.Delete
    suspend fun deleteTask(task: TaskEntity)

    @androidx.room.Query("DELETE FROM tasks")
    suspend fun deleteAllTasks()
}
