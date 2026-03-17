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
    private val reactContext = context

    @ReactMethod
    fun onCreate() {
        val activity = reactContext.currentActivity
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && activity != null) {
            activity.runOnUiThread {
                Log.d("FullScreenActivity", "onCreate: ")
                val w: Window? = activity.window // in Activity's onCreate() for instance
                w?.setFlags(
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                )
            }
        }
    }

    @ReactMethod
    fun onDestroy() {
        val activity = reactContext.currentActivity
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && activity != null) {
            activity.runOnUiThread {
                Log.d("FullScreenActivity", "onDestroy: ")
                val w: Window? = activity.window // in Activity's onCreate() for instance
                w?.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
            }
        }
    }

    @NonNull
    override fun getName(): String {
        return "FullScreenActivity"
    }
}
