internal import Expo
import Firebase
import React
import ReactAppDependencyProvider
import RNBranch
import AppTrackingTransparency

// Scene-based life cycle (required when building with the iOS 27 SDK / Xcode 27).
// Mirrors what expo-build-properties `ios.enableSceneSupport` generates for SDK 57:
// `EXExpoAppSceneDelegate` (declared in Info.plist / InfoRelease.plist under
// UIApplicationSceneManifest) creates the window and starts React Native using the
// factory exposed through `ExpoReactNativeFactoryProvider`, and re-feeds scene URL,
// user-activity and life-cycle events to the overrides below.
@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?
 
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // The scene delegate defaults to "main"; this app registers its root component as "AvaxWallet".
  var reactNativeFactoryModuleName: String { "AvaxWallet" }

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Firebase App Check and configuration
    RNFBAppCheckModule.sharedInstance()
    FirebaseApp.configure()
        
    if let bundleId = Bundle.main.object(forInfoDictionaryKey: "CFBundleIdentifier") as? String, bundleId.lowercased().contains("internal")  {
      RNBranch.useTestInstance()
    }
        
    RNBranch.initSession(launchOptions: launchOptions, isReferrable: true)
    if #available(iOS 14.0, *) {
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        if ATTrackingManager.trackingAuthorizationStatus == .notDetermined {
          ATTrackingManager.requestTrackingAuthorization { status in
            if (status == .authorized) {
              RNBranch.branch.handleATTAuthorizationStatus(status.rawValue)
            }
          }
        }
      }
    }
    
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // Window creation and `startReactNative` moved to EXExpoAppSceneDelegate
    // (scene(_:willConnectTo:options:)), which also rebuilds cold-start URL / universal-link
    // launch options for `Linking.getInitialURL()`.
    // TODO(iOS 27 scenes): `launchOptions` here no longer carries cold-start URLs or user
    // activities. RNBranch.initSession(launchOptions:) still runs; the link itself reaches Branch
    // via the forwarded `application(_:open:options:)` / `application(_:continue:)` overrides.
    // Verify Branch cold-start attribution on a real device (or adopt BranchScene).

    loadRocketSimConnect()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    RNBranch.application(app, open:url, options:options)
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    RNBranch.continue(userActivity)
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }

  public override func applicationDidBecomeActive(_ application: UIApplication) {
    // Reset badge count in app group userDefaults
    // The actual badge count is reset in handleNotificationCleanup inside react native project
    if let userDefaults = UserDefaults(suiteName: "group.org.avalabs.corewallet") {
      userDefaults.set(0, forKey: "badgeCount")
    }
    
    super.applicationDidBecomeActive(application)
  }

  private func loadRocketSimConnect() {
    #if DEBUG
    let frameworkPath = "/Applications/RocketSim.app/Contents/Frameworks/RocketSimConnectLinker.nocache.framework"
    guard let frameworkBundle = Bundle(path: frameworkPath) else {
      print("RocketSim framework not found")
      return
    }
    
    do {
      try frameworkBundle.loadAndReturnError()
      print("RocketSim Connect successfully linked")
    } catch {
      print("Failed to load linker framework: \(error)")
    }
    #endif
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    return bridge.bundleURL ?? bundleURL()
  }
  
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView) // ⬅️ initialize the splash screen
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
} 
