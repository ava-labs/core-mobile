#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import "RNBootSplash.h"
#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
// react-native-flipper-performance-monitor integration
#import <FlipperPerformancePlugin.h>
// shopify/react-native-performance integration
#import <ReactNativePerformance/ReactNativePerformance.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>

static void InitializeFlipper(UIApplication* application) {
  FlipperClient* client = [FlipperClient sharedClient];
  SKDescriptorMapper* layoutDescriptorMapper =
      [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc]
                            initWithRootNode:application
                        withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc]
                      initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  // react-native-flipper-performance-monitor integration
  [client addPlugin:[FlipperPerformancePlugin new]];
  // shopify/react-native-performance integration
  [ReactNativePerformance onAppStarted];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  self.moduleName = @"AvaxWallet";
  
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
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
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  // in order for sourcemap to work with Safari debugging, we replace [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"]; with the statement below
  return [NSURL URLWithString:[[[[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"] absoluteString] stringByAppendingString:@"&inlineSourceMap=true" ]];
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

@end
