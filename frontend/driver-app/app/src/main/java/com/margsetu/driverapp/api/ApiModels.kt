package com.margsetu.driverapp.api

import com.google.gson.annotations.SerializedName

// --- REQUESTS ---

data class LoginRequest(
    val phone: String,
    val password: String
)

data class RefreshRequest(
    @SerializedName("refresh_token") val refreshToken: String
)

data class LocationRequest(
    val latitude: Double,
    val longitude: Double,
    @SerializedName("gps_timestamp") val gpsTimestamp: String
)

// --- RESPONSES ---

// Standardized wrapper (matches our ApiResponse.js in Node)
data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T?,
    val errors: List<String>?
)

data class DriverData(
    val id: String,
    val name: String
)

data class TokenData(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String
)

data class LoginData(
    val driver: DriverData,
    val tokens: TokenData
)

data class TripData(
    @SerializedName("trip_id") val tripId: String,
    val status: String,
    @SerializedName("scheduled_date") val scheduledDate: String,
    @SerializedName("route_code") val routeCode: String,
    @SerializedName("bus_number") val busNumber: String
)

data class LocationData(
    val duplicate: Boolean
)
