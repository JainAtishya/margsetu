package com.margsetu.driverapp.api

import android.content.Context
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object NetworkModule {
    
    // Using the ADB Reverse Tunnel to bypass Windows Firewall!
    private const val BASE_URL = "http://127.0.0.1:3000/"

    // We change this to a function so we can pass the Android Context (needed to open the Keystore vault)
    fun getApi(context: Context): MargSetuApi {
        
        val tokenManager = TokenManager(context)
        val interceptor = AuthInterceptor(tokenManager)
        val authenticator = TokenAuthenticator(tokenManager)

        // We give Retrofit a custom HTTP client that contains our Border Patrol Agent AND our Rescue Team
        val client = OkHttpClient.Builder()
            .addInterceptor(interceptor)
            .authenticator(authenticator)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(MargSetuApi::class.java)
    }
}
