///**
// * Copyright (c) Meta Platforms, Inc. and affiliates.
// *
// *
// * This source code is licensed under the MIT license found in the LICENSE file in the root
// * directory of this source tree.
// */
//package com.avaxwallet
//
//import android.content.Context
//import com.facebook.flipper.android.AndroidFlipperClient
//import com.facebook.react.ReactInstanceEventListener
//
//object ReactNativeFlipper {
//    fun initializeFlipper(context: Context?, reactInstanceManager: ReactInstanceManager) {
//        if (FlipperUtils.shouldEnableFlipper(context)) {
//            val client: FlipperClient = AndroidFlipperClient.getInstance(context)
//            client.addPlugin(InspectorFlipperPlugin(context, DescriptorMapping.withDefaults()))
//            client.addPlugin(ReactFlipperPlugin())
//            client.addPlugin(DatabasesFlipperPlugin(context))
//            client.addPlugin(SharedPreferencesFlipperPlugin(context))
//            client.addPlugin(CrashReporterPlugin.getInstance())
//            client.addPlugin(RNPerfMonitorPlugin(reactInstanceManager)) // react-native-flipper-performance-monitor integration
//            val networkFlipperPlugin = NetworkFlipperPlugin()
//            NetworkingModule.setCustomClientBuilder(
//                object : NetworkingModule.CustomClientBuilder {
//                    override fun apply(builder: Builder) {
//                        builder.addNetworkInterceptor(FlipperOkhttpInterceptor(networkFlipperPlugin))
//                    }
//                })
//            client.addPlugin(networkFlipperPlugin)
//            client.start()
//
//            // Fresco Plugin needs to ensure that ImagePipelineFactory is initialized
//            // Hence we run if after all native modules have been initialized
//            val reactContext: ReactContext = reactInstanceManager.getCurrentReactContext()
//            if (reactContext == null) {
//                reactInstanceManager.addReactInstanceEventListener(
//                    object : ReactInstanceEventListener {
//                        override fun onReactContextInitialized(reactContext: ReactContext) {
//                            reactInstanceManager.removeReactInstanceEventListener(this)
//                            reactContext.runOnNativeModulesQueueThread(
//                                Runnable { client.addPlugin(FrescoFlipperPlugin()) })
//                        }
//                    })
//            } else {
//                client.addPlugin(FrescoFlipperPlugin())
//            }
//        }
//    }
//}
