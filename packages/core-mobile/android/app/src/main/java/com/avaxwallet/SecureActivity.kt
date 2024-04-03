package com.avaxwallet

import android.view.WindowManager
import androidx.annotation.NonNull
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SecureActivity(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    @ReactMethod
    fun onCreate() {
        currentActivity?.runOnUiThread {
            currentActivity?.window?.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }

    @ReactMethod
    fun onDestroy() {
        currentActivity?.runOnUiThread {
            currentActivity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    @NonNull
    override fun getName(): String {
        return "SecureActivity"
    }
}
