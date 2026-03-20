package com.cherryops.app.feature.dispatch

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VoiceCaptureManager @Inject constructor(
    @ApplicationContext private val context: Context
) {

    companion object {
        private const val MAX_DURATION_SECONDS = 60
        private const val TICK_INTERVAL_MS = 1000L
        private const val OUTPUT_FILE_NAME = "voice_capture.webm"
    }

    private val _isRecording = MutableStateFlow(false)
    val isRecording: StateFlow<Boolean> = _isRecording.asStateFlow()

    private val _recordingDuration = MutableStateFlow(0)
    val recordingDuration: StateFlow<Int> = _recordingDuration.asStateFlow()

    private var mediaRecorder: MediaRecorder? = null
    private var timerJob: Job? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    private val outputFile: File
        get() = File(context.cacheDir, OUTPUT_FILE_NAME)

    fun startRecording(): Boolean {
        if (_isRecording.value) return false

        return try {
            val recorder = createMediaRecorder()
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            recorder.setOutputFormat(MediaRecorder.OutputFormat.WEBM)
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.OPUS)
            recorder.setMaxDuration(MAX_DURATION_SECONDS * 1000)
            recorder.setOutputFile(outputFile.absolutePath)

            recorder.prepare()
            recorder.start()
            mediaRecorder = recorder

            _isRecording.value = true
            _recordingDuration.value = 0
            startTimer()

            recorder.setOnInfoListener { _, what, _ ->
                if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) {
                    stopRecording()
                }
            }

            true
        } catch (e: Exception) {
            cleanup()
            false
        }
    }

    fun stopRecording(): ByteArray? {
        if (!_isRecording.value) return null

        return try {
            mediaRecorder?.stop()
            mediaRecorder?.release()
            mediaRecorder = null

            timerJob?.cancel()
            timerJob = null
            _isRecording.value = false

            if (outputFile.exists()) {
                outputFile.readBytes()
            } else {
                null
            }
        } catch (e: Exception) {
            cleanup()
            null
        } finally {
            outputFile.delete()
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = coroutineScope.launch {
            while (isActive && _recordingDuration.value < MAX_DURATION_SECONDS) {
                delay(TICK_INTERVAL_MS)
                _recordingDuration.value += 1
                if (_recordingDuration.value >= MAX_DURATION_SECONDS) {
                    stopRecording()
                }
            }
        }
    }

    private fun cleanup() {
        try {
            mediaRecorder?.release()
        } catch (_: Exception) {
            // Ignore cleanup errors
        }
        mediaRecorder = null
        timerJob?.cancel()
        timerJob = null
        _isRecording.value = false
        _recordingDuration.value = 0
        outputFile.delete()
    }

    @Suppress("DEPRECATION")
    private fun createMediaRecorder(): MediaRecorder {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            MediaRecorder()
        }
    }
}
