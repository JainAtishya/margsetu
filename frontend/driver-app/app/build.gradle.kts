plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.margsetu.driverapp"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.margsetu.driverapp"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.core.ktx)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)

    // Networking (Retrofit + JSON Parser)
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")

    // Security (Encrypted SharedPreferences for JWT tokens)
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // GPS Location Tracking
    implementation("com.google.android.gms:play-services-location:21.2.0")
    
    // Coroutines for background threading
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}