package com.margsetu.driverapp.api

import okhttp3.Interceptor
import okhttp3.Response

// This is our "Border Patrol Agent"
class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        // 1. Grab the outgoing request
        val originalRequest = chain.request()

        // 2. Open the vault and get the token
        val token = tokenManager.getAccessToken() ?: return chain.proceed(originalRequest)

        // 3. If we DO have a token, staple it to the header
        val newRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        // 5. Let the modified request leave the phone
        return chain.proceed(newRequest)
    }
}
