package com.cherryops.app.core.storage

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query

@Entity(tableName = "cached_files")
data class CachedFileEntity(
    @PrimaryKey val cacheKey: String, // "owner/repo:branch:path"
    val name: String,
    val path: String,
    val content: String?,
    val sha: String,
    val size: Long,
    val isDirectory: Boolean,
    val parentPath: String,
    val cachedAt: Long = System.currentTimeMillis()
)

@Dao
interface CachedFileDao {

    @Query("SELECT * FROM cached_files WHERE cacheKey LIKE :repoPrefix || '%' AND parentPath = :parentPath ORDER BY isDirectory DESC, name ASC")
    suspend fun getChildren(repoPrefix: String, parentPath: String): List<CachedFileEntity>

    @Query("SELECT * FROM cached_files WHERE cacheKey = :cacheKey")
    suspend fun getFile(cacheKey: String): CachedFileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFiles(files: List<CachedFileEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFile(file: CachedFileEntity)

    @Query("DELETE FROM cached_files WHERE cacheKey LIKE :repoPrefix || '%'")
    suspend fun clearRepo(repoPrefix: String)

    @Query("DELETE FROM cached_files WHERE cachedAt < :olderThan")
    suspend fun clearStale(olderThan: Long)

    @Query("SELECT COUNT(*) FROM cached_files WHERE cacheKey LIKE :repoPrefix || '%'")
    suspend fun countForRepo(repoPrefix: String): Int
}
