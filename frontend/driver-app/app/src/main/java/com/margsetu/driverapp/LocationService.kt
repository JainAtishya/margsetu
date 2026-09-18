package com.margsetu.driverapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.margsetu.driverapp.api.LocationRequest as ApiLocationRequest
import com.margsetu.driverapp.api.NetworkModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class LocationService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private var currentTripId: String? = null

    // Node.js SMS Gateway 
    private val gatewayPhoneNumber = "+1234567890"

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    val lat = location.latitude
                    val lon = location.longitude
                    
                    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault())
                    sdf.timeZone = TimeZone.getTimeZone("UTC")
                    val timestamp = sdf.format(Date(location.time))

                    sendLocationToBackend(lat, lon, timestamp)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        currentTripId = intent?.getStringExtra("TRIP_ID")
        
        val notification = NotificationCompat.Builder(this, "margsetu_tracker")
            .setContentTitle("MargSetu Driver")
            .setContentText("Transmitting Live Location...")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .build()
        startForeground(1, notification)

        startLocationUpdates()
        return START_STICKY
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000) 
            .build()
        
        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null)
        } catch (e: SecurityException) {
            Log.e("LocationService", "Missing GPS permissions: ${e.message}")
        }
    }

    private fun sendLocationToBackend(lat: Double, lon: Double, timestamp: String) {
        val tripId = currentTripId ?: return

        serviceScope.launch {
            try {
                val request = ApiLocationRequest(lat, lon, timestamp)
                val response = NetworkModule.getApi(applicationContext).submitLocation(tripId, request)
                
                if (response.isSuccessful) {
                    Log.d("LocationService", "HTTP Ping Successful")
                } else {
                    Log.e("LocationService", "HTTP Error: ${response.code()}")
                }
            } catch (e: Exception) {
                Log.e("LocationService", "No Internet or network error: ${e.message}. Triggering SMS Fallback.")
                triggerSmsFallback(lat, lon, timestamp)
            }
        }
    }

    private fun triggerSmsFallback(lat: Double, lon: Double, timestamp: String) {
        try {
            val driverPhone = "+919876543210" 
            val smsMessage = "MSLOC|$driverPhone|$lat|$lon|$timestamp"

            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                applicationContext.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
            
            smsManager.sendTextMessage(gatewayPhoneNumber, null, smsMessage, null, null)
            
            Log.d("LocationService", "SMS Fallback Sent: $smsMessage")
        } catch (e: Exception) {
            Log.e("LocationService", "Failed to send SMS: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        // Only create the channel if the device is Android 8.0 (API 26) or higher
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "margsetu_tracker",
                "MargSetu Live Tracking",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
