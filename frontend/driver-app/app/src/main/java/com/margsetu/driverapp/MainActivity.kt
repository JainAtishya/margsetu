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
        val textTripDetails = findViewById<TextView>(R.id.textTripDetails)
        val btnStartTrip = findViewById<Button>(R.id.btnStartTrip)

        // If the driver is already logged in, skip straight to the dashboard!
        if (tokenManager.getAccessToken() != null) {
            layoutLogin.visibility = View.GONE
            layoutDashboard.visibility = View.VISIBLE
            fetchAssignedTrip(textTripDetails)
        }

        // Login Button Click Listener
        btnLogin.setOnClickListener {
            val phone = inputPhone.text.toString()
            val password = inputPassword.text.toString()

            if (phone.isEmpty() || password.isEmpty()) return@setOnClickListener

            btnLogin.text = "Logging in..."
            btnLogin.isEnabled = false

            // Launch a background coroutine to make the network request
            mainScope.launch {
                try {
                    val request = LoginRequest(phone, password)
                    val response = withContext(Dispatchers.IO) {
                        NetworkModule.getApi(applicationContext).login(request)
                    }

                    if (response.isSuccessful && response.body()?.success == true) {
                        val loginData = response.body()?.data!!
                        // 1. Save tokens securely
                        tokenManager.saveTokens(loginData.tokens.accessToken, loginData.tokens.refreshToken)
                        
                        // 2. Hide Login, Show Dashboard
                        layoutLogin.visibility = View.GONE
                        layoutDashboard.visibility = View.VISIBLE
                        
                        // 3. Fetch the trip assigned to them
                        fetchAssignedTrip(textTripDetails)
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
                        // Tell Android to boot up the GPS Background Service!
                        val serviceIntent = Intent(this@MainActivity, LocationService::class.java)
                        serviceIntent.putExtra("TRIP_ID", tripId)
                        startService(serviceIntent)
                    } else {
                        Toast.makeText(this@MainActivity, "Failed to start trip", Toast.LENGTH_SHORT).show()
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
    }

    private fun fetchAssignedTrip(textTripDetails: TextView) {
        mainScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    NetworkModule.getApi(applicationContext).getAssignedTrip()
                }

                if (response.isSuccessful && response.body()?.success == true) {
                    val trip = response.body()?.data!!
                    currentTripId = trip.tripId
                    textTripDetails.text = "Bus: ${trip.busNumber}\nRoute: ${trip.routeCode}\nStatus: ${trip.status}"
                } else {
                    textTripDetails.text = "No trip assigned for today."
                }
            } catch (e: Exception) {
                textTripDetails.text = "Network error fetching trip."
            }
        }
    }
}