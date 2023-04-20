# Patches

### react-native-flipper-performance-plugin+0.4.0.patch

Android:
- adjust gradle to make it work with release builds

iOS:
- change collect interval to 1s to fix FPS wrong calculation.

- there are also changes on the flipper side https://github.com/ava-labs/react-native-flipper-performance-monitor/pull/1

### react-native-flipper+0.187.1.patch

This patch is needed to make sure react-native-flipper on iOS dynamically sets the FB_SONARKIT_ENABLED flag based on whether flipper is enabled. See ios/Podfile for more info.

### react-native-graph+1.0.1.patch
1/ AnimatedLineGraph.js
- disable indicatorPulse logic as it uses the deprecated `useSharedValueEffect` and causes `Null is not an object (evaluating ‘dispatcher.useRef’)`
- add an assertion around pointsInRange logic to prevent `Undefined is not an object pointsInRange`
- add support for shadowColor prop
- disable selection dot's getYForX logic as it runs on JS thread and drastically slows down Android

2/ CreateGraphPath.ts
- disable isExactPointInsidePixelRatio logic as it creates invalid graphs. more info here https://github.com/margelo/react-native-graph/issues/70