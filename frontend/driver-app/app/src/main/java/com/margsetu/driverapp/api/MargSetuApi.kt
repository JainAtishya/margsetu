package com.margsetu.driverapp.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface MargSetuApi {

    @POST("api/driver/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginData>>

    @POST("api/driver/auth/refresh")
    suspend fun refreshSession(@Body request: RefreshRequest): Response<ApiResponse<TokenData>>

    // We don't need to pass the token anymore! The Interceptor handles it!
    @GET("api/driver/trip")
    suspend fun getAssignedTrip(): Response<ApiResponse<TripData>>

    @POST("api/driver/trip/{tripId}/start")
    suspend fun startTrip(
        @Path("tripId") tripId: String
    ): Response<ApiResponse<TripData>>

    @POST("api/driver/trip/{tripId}/location")
    suspend fun submitLocation(
        @Path("tripId") tripId: String,
        @Body location: LocationRequest
    ): Response<ApiResponse<LocationData>>
}
