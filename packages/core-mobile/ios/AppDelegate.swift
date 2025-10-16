import Expo
import Firebase
import React
import ReactAppDependencyProvider
import RNBranch

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
 
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Firebase App Check and configuration
    RNFBAppCheckModule.sharedInstance()
    FirebaseApp.configure()
    
    if let displayName = Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String, displayName.lowercased().contains("internal")  {
      RNBranch.useTestInstance()
    }
    RNBranch.initSession(launchOptions: launchOptions, isReferrable: true)
    
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    #if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "AvaxWallet",
      in: window,
      launchOptions: launchOptions)
    #endif

    loadRocketSimConnect()
    
    if let branchDict = Bundle.main.object(forInfoDictionaryKey: "branch_key") as? [String: Any] {
        let testKey = branchDict["test"] as? String ?? "missing"
        let liveKey = branchDict["live"] as? String ?? "missing"

        // Determine current mode manually
        let displayName = Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? ""
        let isUsingTestInstance = displayName.lowercased().contains("internal") 
        let currentMode = isUsingTestInstance ? "TEST" : "LIVE"

        print("🔑 Branch Keys -> test: \(testKey), live: \(liveKey)")
        print("🧩 Current Branch mode: \(currentMode)")

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            if let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
               let window = scene.windows.first(where: { $0.isKeyWindow }) {
                
                let alert = UIAlertController(
                    title: "Branch Configuration",
                    message: """
                    Mode: \(currentMode)
                    Test Key: \(testKey)
                    Live Key: \(liveKey)
                    """,
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                window.rootViewController?.present(alert, animated: true)
            } else {
                print("⚠️ Unable to find an active window scene for displaying alert.")
            }
        }
    } else {
        print("⚠️ Could not find branch_key in Info.plist")
    }
    
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
