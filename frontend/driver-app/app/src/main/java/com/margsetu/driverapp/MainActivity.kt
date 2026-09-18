package com.margsetu.driverapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.margsetu.driverapp.api.LoginRequest
import com.margsetu.driverapp.api.NetworkModule
import com.margsetu.driverapp.api.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var tokenManager: TokenManager
    private val mainScope = CoroutineScope(Dispatchers.Main)

    private var currentTripId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tokenManager = TokenManager(this)

        // UI Elements
        val layoutLogin = findViewById<LinearLayout>(R.id.layoutLogin)
        val layoutDashboard = findViewById<LinearLayout>(R.id.layoutDashboard)
        val inputPhone = findViewById<EditText>(R.id.inputPhone)
        val inputPassword = findViewById<EditText>(R.id.inputPassword)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val cardTripItem = findViewById<View>(R.id.cardTripItem)
        val textRouteName = findViewById<TextView>(R.id.textRouteName)
        val textBusInfo = findViewById<TextView>(R.id.textBusInfo)
        val textTripFullDetails = findViewById<TextView>(R.id.textTripFullDetails)
        val btnStartTrip = findViewById<Button>(R.id.btnStartTrip)
        val btnEndTrip = findViewById<Button>(R.id.btnEndTrip)
        val btnBack = findViewById<View>(R.id.btnBack)
        val btnLogout = findViewById<View>(R.id.btnLogout)
        
        val layoutTripDetails = findViewById<View>(R.id.layoutTripDetails)

        // If the driver is already logged in, skip straight to the dashboard!
        if (tokenManager.getAccessToken() != null) {
            layoutLogin.visibility = View.GONE
            layoutDashboard.visibility = View.VISIBLE
            fetchAssignedTrip(textRouteName, textBusInfo, textTripFullDetails)
        }

        // Dashboard Item Click Listener
        cardTripItem.setOnClickListener {
            val tripId = currentTripId ?: return@setOnClickListener
            
            // Show a tiny loading state (optional, but good UX)
            textTripFullDetails.text = "Loading details..."
            layoutDashboard.visibility = View.GONE
            layoutTripDetails.visibility = View.VISIBLE

            mainScope.launch {
                try {
                    val response = withContext(Dispatchers.IO) {
                        NetworkModule.getApi(applicationContext).getTripDetails(tripId)
                    }

                    if (response.isSuccessful && response.body()?.success == true) {
                        val details = response.body()?.data!!
                        val fullText = """
                            Bus Plate: ${details.bus.registrationNumber}
                            Bus Capacity: ${details.bus.capacity} seats
                            Route Name: ${details.route.name}
                            Route Code: ${details.route.code}
                            Status: ${details.status}
                        """.trimIndent()
                        textTripFullDetails.text = fullText
                    } else {
                        textTripFullDetails.text = "Failed to load detailed info."
                    }
                } catch (e: Exception) {
                    textTripFullDetails.text = "Network Error loading details."
                }
            }
        }

        // Back Button Click Listener
        btnBack.setOnClickListener {
            layoutTripDetails.visibility = View.GONE
            layoutDashboard.visibility = View.VISIBLE
        }

        // Logout Button Click Listener
        btnLogout.setOnClickListener {
            mainScope.launch {
                try {
                    withContext(Dispatchers.IO) {
                        NetworkModule.getApi(applicationContext).logout()
                    }
                } catch (e: Exception) {}
                
                tokenManager.clearTokens()
                currentTripId = null
                
                val serviceIntent = Intent(this@MainActivity, LocationService::class.java)
                stopService(serviceIntent)
                
                layoutDashboard.visibility = View.GONE
                layoutTripDetails.visibility = View.GONE
                layoutLogin.visibility = View.VISIBLE
            }
        }

        // Login Button Click Listener
        btnLogin.setOnClickListener {
            val phone = inputPhone.text.toString()
            val password = inputPassword.text.toString()

            if (phone.isEmpty() || password.isEmpty()) return@setOnClickListener

            btnLogin.text = "Logging in..."
            btnLogin.isEnabled = false

            mainScope.launch {
                try {
                    val request = LoginRequest(phone, password)
                    val response = withContext(Dispatchers.IO) {
                        NetworkModule.getApi(applicationContext).login(request)
                    }

                    if (response.isSuccessful && response.body()?.success == true) {
                        val loginData = response.body()?.data!!
                        tokenManager.saveTokens(loginData.tokens.accessToken, loginData.tokens.refreshToken)
                        
                        layoutLogin.visibility = View.GONE
                        layoutDashboard.visibility = View.VISIBLE
                        
                        fetchAssignedTrip(textRouteName, textBusInfo, textTripFullDetails)
                    } else {
                        Toast.makeText(this@MainActivity, "Login Failed", Toast.LENGTH_SHORT).show()
                        btnLogin.text = "Login"
                        btnLogin.isEnabled = true
                    }
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "🔥 FULL NETWORK ERROR 🔥", e)
                    Toast.makeText(this@MainActivity, "Network Error: ${e.message}", Toast.LENGTH_LONG).show()
                    btnLogin.text = "Login"
                    btnLogin.isEnabled = true
                }
            }
        }

        // Start Trip Button Click Listener
        btnStartTrip.setOnClickListener {
            // Android 14+ requires runtime location permissions before starting a Location Foreground Service
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                androidx.core.app.ActivityCompat.requestPermissions(
                    this, 
                    arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACCESS_COARSE_LOCATION), 
                    1001
                )
                Toast.makeText(this, "Please grant location permission and click Start again", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }

            val tripId = currentTripId ?: return@setOnClickListener
            btnStartTrip.text = "Starting..."
            btnStartTrip.isEnabled = false

            mainScope.launch {
                try {
                    val response = withContext(Dispatchers.IO) {
                        NetworkModule.getApi(applicationContext).startTrip(tripId)
                    }

                    if (response.isSuccessful) {
                        btnStartTrip.text = "GPS Tracking Active"
                        val serviceIntent = Intent(this@MainActivity, LocationService::class.java)
                        serviceIntent.putExtra("TRIP_ID", tripId)
                        startService(serviceIntent)
                    } else {
                        Toast.makeText(this@MainActivity, "Failed to start", Toast.LENGTH_SHORT).show()
                        btnStartTrip.text = "Start GPS Tracking"
                        btnStartTrip.isEnabled = true
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Network Error", Toast.LENGTH_SHORT).show()
                    btnStartTrip.text = "Start GPS Tracking"
                    btnStartTrip.isEnabled = true
                }
            }
        }

        // End Trip Button Click Listener
        btnEndTrip.setOnClickListener {
            val tripId = currentTripId ?: return@setOnClickListener
            btnEndTrip.text = "Ending..."
            btnEndTrip.isEnabled = false

            mainScope.launch {
                try {
                    val response = withContext(Dispatchers.IO) {
                        NetworkModule.getApi(applicationContext).endTrip(tripId)
                    }

                    if (response.isSuccessful) {
                        val serviceIntent = Intent(this@MainActivity, LocationService::class.java)
                        stopService(serviceIntent)
                        
                        // Kick them back to dashboard and refresh
                        layoutTripDetails.visibility = View.GONE
                        layoutDashboard.visibility = View.VISIBLE
                        fetchAssignedTrip(textRouteName, textBusInfo, textTripFullDetails)
                        
                        btnEndTrip.text = "End Trip"
                        btnEndTrip.isEnabled = true
                        btnStartTrip.text = "Start GPS Tracking"
                        btnStartTrip.isEnabled = true
                    } else {
                        Toast.makeText(this@MainActivity, "Failed to end", Toast.LENGTH_SHORT).show()
                        btnEndTrip.text = "End Trip"
                        btnEndTrip.isEnabled = true
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Network Error", Toast.LENGTH_SHORT).show()
                    btnEndTrip.text = "End Trip"
                    btnEndTrip.isEnabled = true
                }
            }
        }
    }

    private fun fetchAssignedTrip(textRouteName: TextView, textBusInfo: TextView, textTripFullDetails: TextView) {
        mainScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    NetworkModule.getApi(applicationContext).getAssignedTrip()
                }

                if (response.isSuccessful && response.body()?.success == true) {
                    val trip = response.body()?.data!!
                    currentTripId = trip.tripId
                    
                    // Human readable date (e.g. "2026-09-18T18:30:00.000Z" -> "2026-09-18")
                    val rawDate = trip.scheduledDate
                    val cleanDate = if (rawDate.contains("T")) rawDate.split("T")[0] else rawDate

                    // Populate UI
                    textRouteName.text = trip.routeName
                    textBusInfo.text = "Bus: ${trip.busNumber} • Date: $cleanDate"
                    
                } else {
                    currentTripId = null // CLEAR THE ID SO THEY CANNOT CLICK
                    textRouteName.text = "No trips assigned"
                    textBusInfo.text = "You are off duty today."
                }
            } catch (e: Exception) {
                currentTripId = null // CLEAR THE ID ON ERROR TOO
                textRouteName.text = "Network error"
                textBusInfo.text = "Could not fetch trips."
            }
        }
    }
}