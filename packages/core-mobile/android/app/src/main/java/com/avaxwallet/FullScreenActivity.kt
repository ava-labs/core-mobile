package com.avaxwallet

import android.os.Build
import android.util.Log
import android.view.Window
import android.view.WindowManager
import androidx.annotation.NonNull
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FullScreenActivity(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    @ReactMethod
    fun onCreate() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && currentActivity != null) {
            currentActivity?.runOnUiThread {
                Log.d("FullScreenActivity", "onCreate: ")
                val w: Window? = currentActivity?.window // in Activity's onCreate() for instance
                w?.setFlags(
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                )
            }
        }
    }

    @ReactMethod
    fun onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && currentActivity != null) {
            currentActivity?.runOnUiThread {
                Log.d("FullScreenActivity", "onDestroy: ")
                val w: Window? = currentActivity?.window // in Activity's onCreate() for instance
                w?.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
            }
        }
    }

    @NonNull
    override fun getName(): String {
        return "FullScreenActivity"
    }
}
