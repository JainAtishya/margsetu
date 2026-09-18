package com.margsetu.driverapp.api

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

import androidx.core.content.edit

// This class acts as a highly secure vault for our JWT tokens.
class TokenManager(context: Context) {

    // 1. We create a Master Key that lives in the phone's physical hardware Keystore
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    // 2. We create an encrypted file on the hard drive. 
    // Anything saved here is encrypted using the Master Key.
    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_driver_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // Save tokens securely
    fun saveTokens(accessToken: String, refreshToken: String) {
        sharedPreferences.edit {
            putString("ACCESS_TOKEN", accessToken)
            putString("REFRESH_TOKEN", refreshToken)
        }
    }

    // Retrieve tokens
    fun getAccessToken(): String? {
        return sharedPreferences.getString("ACCESS_TOKEN", null)
    }

    fun getRefreshToken(): String? {
        return sharedPreferences.getString("REFRESH_TOKEN", null)
    }

    // Clear tokens on logout or security breach
    fun clearTokens() {
        sharedPreferences.edit { clear() }
    }
}
