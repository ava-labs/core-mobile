# Patches

### react-native-flipper-performance-plugin+0.4.0.patch

Android:
- adjust gradle to make it work with release builds

iOS:
- change collect interval to 1s to fix FPS wrong calculation.

- there are also changes on the flipper side https://github.com/ava-labs/react-native-flipper-performance-monitor/pull/1

### react-native-flipper+0.187.1.patch

This patch is needed to make sure react-native-flipper on iOS dynamically sets the FB_SONARKIT_ENABLED flag based on whether flipper is enabled. See ios/Podfile for more info.