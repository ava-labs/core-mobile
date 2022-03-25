//
//  AppDelegate.swift
//  AvaxWallet
//
//  Created by Eduardo Gueiros on 3/24/22.
//

import UIKit
import UserNotifications
#if DEBUG
import FlipperKit
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  
  var window: UIWindow?
  var bridge: RCTBridge!
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    UIApplication.shared.registerForRemoteNotifications()
    
    // Flipper
            #if DEBUG
            let flipperClient = FlipperClient.shared()
            let layoutDescriptorMapper = SKDescriptorMapper(defaults: ())
            flipperClient?.add(FlipperKitLayoutPlugin(rootNode: application, with: layoutDescriptorMapper!))
            flipperClient?.add(FKUserDefaultsPlugin(suiteName: nil))
            flipperClient?.add(FlipperKitReactPlugin())
            flipperClient?.add(FlipperKitNetworkPlugin(networkAdapter: SKIOSNetworkAdapter()))
            flipperClient?.start()
            #endif
    
    let jsCodeLocation: URL
    jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource:nil)
    
    let rootView = RCTRootView(bundleURL: jsCodeLocation, moduleName: "AvaxWallet", initialProperties: nil, launchOptions: launchOptions)
        let rootViewController = UIViewController()
        rootViewController.view = rootView
        self.window = UIWindow(frame: UIScreen.main.bounds)
        self.window?.rootViewController = rootViewController
        self.window?.makeKeyAndVisible()
        
    return true
  }
}
