package com.cherryops.app.core.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom

/**
 * GitHub OAuth PKCE flow helper.
 * Generates code verifier/challenge and builds the authorization URL.
 */
object GitHubOAuth {

    private const val CODE_VERIFIER_LENGTH = 64
    private const val REDIRECT_URI = "cherryops://oauth/callback"
    private const val SCOPE = "repo user"

    data class PkceChallenge(
        val codeVerifier: String,
        val codeChallenge: String,
        val codeChallengeMethod: String = "S256"
    )

    fun generatePkceChallenge(): PkceChallenge {
        val verifierBytes = ByteArray(CODE_VERIFIER_LENGTH)
        SecureRandom().nextBytes(verifierBytes)
        val codeVerifier = Base64.encodeToString(
            verifierBytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        )

        val digest = MessageDigest.getInstance("SHA-256")
        val challengeBytes = digest.digest(codeVerifier.toByteArray(Charsets.US_ASCII))
        val codeChallenge = Base64.encodeToString(
            challengeBytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        )

        return PkceChallenge(
            codeVerifier = codeVerifier,
            codeChallenge = codeChallenge
        )
    }

    fun buildAuthorizationUrl(clientId: String, challenge: PkceChallenge, state: String): Uri {
        return Uri.parse("https://github.com/login/oauth/authorize").buildUpon()
            .appendQueryParameter("client_id", clientId)
            .appendQueryParameter("redirect_uri", REDIRECT_URI)
            .appendQueryParameter("scope", SCOPE)
            .appendQueryParameter("state", state)
            .appendQueryParameter("code_challenge", challenge.codeChallenge)
            .appendQueryParameter("code_challenge_method", challenge.codeChallengeMethod)
            .build()
    }

    fun createAuthIntent(clientId: String, challenge: PkceChallenge, state: String): Intent {
        val url = buildAuthorizationUrl(clientId, challenge, state)
        return Intent(Intent.ACTION_VIEW, url)
    }

    fun parseCallbackUri(uri: Uri): Pair<String?, String?> {
        val code = uri.getQueryParameter("code")
        val state = uri.getQueryParameter("state")
        return code to state
    }

    fun getRedirectUri(): String = REDIRECT_URI
}
