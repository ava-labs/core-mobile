package com.avaxwallet;

import android.app.Application
import android.database.CursorWindow
import android.webkit.WebSettings
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.soloader.SoLoader
import java.lang.reflect.Field

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
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

        increaseWindowCursorSize()

        // Manually set user agent to our format. This helps avoid getting identified as a bot and rate limited by cloudflare
        // the default format is usually okhttp/x.x.x
        // while our format is
        // avaxwallet/0.14.15.1532 Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ1A.221205.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36
        OkHttpClientProvider.setOkHttpClientFactory(CoreOkHttpClientFactory(getUserAgent()))

        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
    }

    private fun increaseWindowCursorSize() {
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
    }

    private fun getUserAgent(): String {
        try {
            val shortPackageName = packageName.substring(packageName.lastIndexOf(".") + 1)
            val appVersion = BuildConfig.VERSION_NAME
            val buildNumber = BuildConfig.VERSION_CODE
            val systemUserAgent = WebSettings.getDefaultUserAgent(this.applicationContext)
            return "$shortPackageName/$appVersion.$buildNumber $systemUserAgent"
        } catch (e: java.lang.Exception) {
            e.printStackTrace()
            return ""
        }
    }
}