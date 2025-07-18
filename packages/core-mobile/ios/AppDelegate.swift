import FirebaseCore
import Expo
import React
import ReactAppDependencyProvider


@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var dependencyProvider: RCTAppDependencyProvider?
 
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
 
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Firebase configuration
    RNFBAppCheckModule.sharedInstance() // <-- new for AppCheck to work
    FirebaseApp.configure()   
    
    self.dependencyProvider = RCTAppDependencyProvider()
    
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
 
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    loadRocketSimConnect()

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "AvaxWallet",
      in: window,
      launchOptions: launchOptions)
#endif
 
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
 
  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }
 
  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
  
  private func loadRocketSimConnect() {
#if DEBUG
    let frameworkPath = "/Applications/RocketSim.app/Contents/Frameworks/RocketSimConnectLinker.nocache.framework"
    guard let frameworkBundle = Bundle(path: frameworkPath) else {
      print("Failed to find RocketSim framework")
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
  
  public override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    
    // this only reset the badgeCount in app group userDefaults,
    // the actual badge count is reset in handleNotificationCleanup
    // inside react native project
    if let userDefaults = UserDefaults(suiteName: "group.org.avalabs.corewallet") {
      userDefaults.set(0, forKey: "badgeCount")
    }
  }
}
 
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins
 
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
