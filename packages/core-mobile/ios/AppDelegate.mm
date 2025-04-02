#import "AppDelegate.h"
#import "RNFBAppCheckModule.h"
#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import "RNBootSplash.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [RNFBAppCheckModule sharedInstance];
  [FIRApp configure];
  self.moduleName = @"AvaxWallet";
  
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
  [self loadRocketSimConnect];
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  RCTRootView * rootView = (RCTRootView *)[super createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];  
  return rootView;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}


- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

- (void)loadRocketSimConnect {
#if DEBUG
    NSString *frameworkPath = @"/Applications/RocketSim.app/Contents/Frameworks/RocketSimConnectLinker.nocache.framework";
    NSBundle *frameworkBundle = [NSBundle bundleWithPath:frameworkPath];
    NSError *error = nil;

    if (![frameworkBundle loadAndReturnError:&error]) {
        NSLog(@"Failed to load linker framework: %@", error);
        return;
    }

    NSLog(@"RocketSim Connect successfully linked");
#endif
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  // this only reset the badgeCount in app group userDefaults,
  // the actual badge count is reset in handleNotificationCleanup
  // inside react native project
  [[[NSUserDefaults alloc] initWithSuiteName:@"group.org.avalabs.corewallet"] setInteger:0 forKey:@"badgeCount"];
}
@end
