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

3/ StaticLineGraph.tsx
- add support for gradient fill
- add useSVG prop - render graph path as svg. this logic is needed on Android as rendering multiple canvases at once makes the app unresponsive.

### rn-dominant-color+1.7.2.patch

Android implementation of `getColorFromURL` will crash when facing urls with `ipfs://` scheme/protocol. The patch allows the method to fail without crashing.

### pino+7.11.0.patch

Calling pino({ level: 'error' }) will throw an error `Cannot assign to read only property 'error' of object`. The patch just replaces Object.create with Object.assign. Pino is the logger of Wallet Connect V2.

### @walletconnect+react-native-compat+2.10.1.patch

commenting out "react-native-get-random-values" as we already use getRandomValues from "react-native-quick-crypto"

commenting out import "react-native-url-polyfill/auto" as we already import it ourselves

### @react-native+0.70.14.patch

commenting out assertions in JSCRuntime.cpp that checked if API object and API string counters are zero in debug to avoid crash in fast refresh

changed the warning message about ViewPropTypes being removed from React Native, to import ViewPropTypes from deprecated-react-native-prop-types

modified condition statements with $USE_HERMES in react-native-xcode.sh to avoid error with generating hermes bundle in release mode