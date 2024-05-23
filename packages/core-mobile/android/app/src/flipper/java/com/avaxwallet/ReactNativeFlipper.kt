/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.avaxwallet

import android.content.Context
import com.facebook.flipper.android.AndroidFlipperClient
import com.facebook.react.ReactInstanceEventListener
import com.facebook.flipper.android.utils.FlipperUtils
import com.facebook.flipper.core.FlipperClient
import com.facebook.react.ReactInstanceManager
import com.facebook.react.modules.network.NetworkingModule
import com.facebook.flipper.plugins.network.FlipperOkhttpInterceptor
import com.facebook.flipper.plugins.inspector.DescriptorMapping
import okhttp3.OkHttpClient
import tech.bam.rnperformance.flipper.RNPerfMonitorPlugin;
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin
import com.facebook.flipper.plugins.crashreporter.CrashReporterPlugin
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin
import com.facebook.flipper.plugins.react.ReactFlipperPlugin
import com.facebook.flipper.plugins.databases.DatabasesFlipperPlugin
import com.facebook.flipper.plugins.sharedpreferences.SharedPreferencesFlipperPlugin

object ReactNativeFlipper {
    fun initializeFlipper(context: Context?, reactInstanceManager: ReactInstanceManager) {
        if (FlipperUtils.shouldEnableFlipper(context)) {
            val client: FlipperClient = AndroidFlipperClient.getInstance(context)
            client.addPlugin(ReactFlipperPlugin())
            client.addPlugin(InspectorFlipperPlugin(context, DescriptorMapping.withDefaults()))
            client.addPlugin(CrashReporterPlugin.getInstance())
            client.addPlugin(DatabasesFlipperPlugin(context))
            client.addPlugin(SharedPreferencesFlipperPlugin(context))
            client.addPlugin(RNPerfMonitorPlugin(reactInstanceManager)) // react-native-flipper-performance-monitor integration
            val networkFlipperPlugin = NetworkFlipperPlugin()
            NetworkingModule.setCustomClientBuilder(
                object : NetworkingModule.CustomClientBuilder {
                    override fun apply(builder: OkHttpClient.Builder) {
                        builder.addNetworkInterceptor(FlipperOkhttpInterceptor(networkFlipperPlugin))
                    }
                })
            client.addPlugin(networkFlipperPlugin)
            client.start()
        }
    }
}
