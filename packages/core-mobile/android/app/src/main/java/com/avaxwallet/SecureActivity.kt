package com.avaxwallet

import android.view.WindowManager
import androidx.annotation.NonNull
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SecureActivity(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val reactContext = context

    @ReactMethod
    fun onCreate() {
        val activity = reactContext.currentActivity ?: return
        activity.runOnUiThread {
            activity.window?.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }

    @ReactMethod
    fun onDestroy() {
        val activity = reactContext.currentActivity ?: return
        activity.runOnUiThread {
            activity.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    @NonNull
    override fun getName(): String {
        return "SecureActivity"
    }
}
