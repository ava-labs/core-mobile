package com.avaxwallet;

import android.app.Application;
import android.content.Context;
import android.database.CursorWindow;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import com.facebook.soloader.SoLoader;

import java.lang.reflect.Field;
import java.util.List;

import io.csie.kudo.reactnative.v8.executor.V8ExecutorFactory;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost =
            new ReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                @Override
                protected List<ReactPackage> getPackages() {
                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    packages.add(new MainPackage());
                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }

                @Override
                protected JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
                    return new V8ExecutorFactory(
                            getApplicationContext(),
                            getPackageName(),
                            AndroidInfoHelpers.getFriendlyDeviceName(),
                            getUseDeveloperSupport());
                }
            };

    @Override
    public ReactNativeHost getReactNativeHost() {
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // TODO return mNewArchitectureNativeHost after it is implemented
            return mReactNativeHost;
        } else {
            return mReactNativeHost;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Temp workaround for data not getting persisted on Android
        // https://github.com/rt2zz/redux-persist/issues/199
        // https://github.com/rt2zz/redux-persist/issues/960
        // Basically, retrieving data from AsyncStorage is limited by a size of a WindowCursor
        // which is a buffer used to read data from SQLite (what AsyncStorage uses)
        // Currently it's size is around 2 MB. This means that the single item read at one time cannot be larger than 2 MB.
        // Here we are increasing it to 10 MB to get around this issue
        try {
            Field field = CursorWindow.class.getDeclaredField("sCursorWindowSize");
            field.setAccessible(true);
            field.set(null, 10 * 1024 * 1024); // 10MB
        } catch (Exception e) {
            e.printStackTrace();
        }

        // If you opted-in for the New Architecture, we enable the TurboModule system
        ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.FLIPPER_ENABLED) {
            ReactNativeFlipper.initializeFlipper(context, reactInstanceManager);
        }
    }
}
