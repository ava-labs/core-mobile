package com.avaxwallet;

import android.os.Build;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FullScreenActivity extends ReactContextBaseJavaModule {
    FullScreenActivity(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void onCreate() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && getCurrentActivity() != null) {
            getCurrentActivity().runOnUiThread(() -> {
                Log.d("FullScreenActivity", "onCreate: ");
                Window w =  getCurrentActivity().getWindow(); // in Activity's onCreate() for instance
                w.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
            });
        }
    }

    @ReactMethod
    public void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && getCurrentActivity() != null) {
            getCurrentActivity().runOnUiThread(() -> {
                Log.d("FullScreenActivity", "onDestroy: ");
                Window w =  getCurrentActivity().getWindow(); // in Activity's onCreate() for instance
                w.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
            });
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "FullScreenActivity";
    }
}
