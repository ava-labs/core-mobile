package com.avaxwallet;

import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SecureActivity extends ReactContextBaseJavaModule {
    SecureActivity(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void onCreate() {
        getCurrentActivity().runOnUiThread(() -> {
            getCurrentActivity().getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        });

    }

    @ReactMethod
    public void onDestroy() {
        getCurrentActivity().runOnUiThread(() -> {
            getCurrentActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
        });
    }

    @NonNull
    @Override
    public String getName() {
        return "SecureActivity";
    }
}
