package com.avaxwallet;

import android.app.Application
import android.content.Context
import android.database.CursorWindow
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import java.lang.reflect.Field
import java.util.ArrayList

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): ArrayList<ReactPackage>? =
                PackageList(this).packages.apply {
                    add(MainPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

        // Temp workaround for data not getting persisted on Android
        // https://github.com/rt2zz/redux-persist/issues/199
        // https://github.com/rt2zz/redux-persist/issues/960
        // Basically, retrieving data from AsyncStorage is limited by a size of a WindowCursor
        // which is a buffer used to read data from SQLite (what AsyncStorage uses)
        // Currently it's size is around 2 MB. This means that the single item read at one time cannot be larger than 2 MB.
        // Here we are increasing it to 10 MB to get around this issue
        try {
            val field: Field = CursorWindow::class.java.getDeclaredField("sCursorWindowSize")
            field.isAccessible = true
            field.set(null, 10 * 1024 * 1024) // 10MB
        } catch (e: Exception) {
            e.printStackTrace()
        }

        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }


        initializeFlipper(this, reactNativeHost.reactInstanceManager)
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, reactNativeHost.reactInstanceManager)
     *
     * @param context
     * @param reactInstanceManager
     */
    private fun initializeFlipper(
        context: Context,
        reactInstanceManager: ReactInstanceManager
    ) {
        if (BuildConfig.FLIPPER_ENABLED) {
            // ReactNativeFlipper.initializeFlipper(context, reactInstanceManager)
        }
    }
}