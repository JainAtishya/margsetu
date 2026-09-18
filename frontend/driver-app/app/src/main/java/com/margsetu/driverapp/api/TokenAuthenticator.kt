package com.margsetu.driverapp.api

import okhttp3.Authenticator
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.Route
import org.json.JSONObject

// The Rescue Team: This only triggers if the backend returns a 401 Unauthorized error.
class TokenAuthenticator(private val tokenManager: TokenManager) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        val refreshToken = tokenManager.getRefreshToken()
        
        if (refreshToken == null) {
            // We don't have a refresh token. The user is fully logged out.
            return null
        }

        // 1. Make a synchronous network call to our Node.js /refresh endpoint
        val client = OkHttpClient()
        
        // Build the JSON body manually to avoid circular dependencies with Retrofit
        val json = JSONObject()
        json.put("refresh_token", refreshToken)
        
        // Using OkHttp 3.x Java syntax since Retrofit uses it by default
        val mediaType = MediaType.parse("application/json")
        val body = RequestBody.create(mediaType, json.toString())

        val refreshRequest = Request.Builder()
            .url("http://127.0.0.1:3000/api/driver/auth/refresh")
            .post(body)
            .build()

        val refreshResponse = client.newCall(refreshRequest).execute()

        if (refreshResponse.isSuccessful) {
            // 2. Parse the new tokens from the Node.js response using OkHttp 3.x getter methods
            val responseBody = refreshResponse.body()?.string()
            if (responseBody != null) {
                val jsonResponse = JSONObject(responseBody)
                if (jsonResponse.getBoolean("success")) {
                    val data = jsonResponse.getJSONObject("data")
                    val newAccessToken = data.getString("access_token")
                    val newRefreshToken = data.getString("refresh_token")

                    // 3. Save the new tokens to the Secure Vault
                    tokenManager.saveTokens(newAccessToken, newRefreshToken)

                    // 4. Retry the original request that failed, but with the NEW token!
                    return response.request().newBuilder()
                        .header("Authorization", "Bearer $newAccessToken")
                        .build()
                }
            }
        }

        // If the refresh token was revoked or expired, clear the vault. The user must login again.
        tokenManager.clearTokens()
        return null
    }
}
