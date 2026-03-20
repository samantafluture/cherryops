package com.cherryops.app.feature.dispatch

import com.cherryops.app.data.task.ApiException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TranscriptionService @Inject constructor(
    private val httpClient: OkHttpClient,
    private val baseUrlProvider: BaseUrlProvider
) {

    suspend fun transcribe(
        audioData: ByteArray,
        mimeType: String = "audio/webm"
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart(
                    "audio",
                    "recording.webm",
                    audioData.toRequestBody(mimeType.toMediaType())
                )
                .build()

            val request = Request.Builder()
                .url("${baseUrlProvider.getBaseUrl()}/api/voice/transcribe")
                .post(requestBody)
                .build()

            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                val body = response.body?.string()
                    ?: throw IllegalStateException("Empty transcription response")
                val json = JSONObject(body)
                json.getString("transcript")
            } else {
                throw ApiException(
                    code = response.code,
                    message = response.body?.string() ?: "Transcription failed"
                )
            }
        }
    }
}

interface BaseUrlProvider {
    fun getBaseUrl(): String
}
