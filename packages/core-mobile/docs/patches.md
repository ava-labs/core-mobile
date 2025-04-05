# Patches

## How to patch

1. adjust the code the package you want to patch
2. in core-mobile folder, run `../../scripts/patch-package.sh [dependency]`. it should create a patch file in core-mobile/patches folder

## Current patches

### react-native-graph+1.1.0.patch

1/ AnimatedLineGraph.js

- add an assertion around pointsInRange logic to prevent `Undefined is not an object pointsInRange`
- add support for shadowColor prop
- disable selection dot's getYForX logic as it runs on JS thread and drastically slows down Android

2/ CreateGraphPath.ts

- disable isExactPointInsidePixelRatio logic as it creates invalid graphs. more info here https://github.com/margelo/react-native-graph/issues/70

3/ StaticLineGraph.tsx

- add support for gradient fill

### rn-dominant-color+1.7.2.patch

Android implementation of `getColorFromURL` will crash when facing urls with `ipfs://` scheme/protocol. The patch allows the method to fail without crashing.

### pino+7.11.0.patch

Calling pino({ level: 'error' }) will throw an error `Cannot assign to read only property 'error' of object`. The patch just replaces Object.create with Object.assign. Pino is the logger of Wallet Connect V2.

### @walletconnect+react-native-compat+2.11.0.patch

commenting out import "react-native-url-polyfill/auto" as we already import it ourselves

### @react-native+0.76.2.patch

commenting out assertions in JSCRuntime.cpp that checked if API object and API string counters are zero in debug to avoid crash in fast refresh

HMRClient.js: adjust stringify logic of object to make logs in Terminal more readable

### @hpke+core+1.2.7.patch

for some reason, metro can only consume esm folder so we had to adjust the package.json to only expose esm folder

### react-native-svg+15.8.0.patch

to prevent a crash on iOS when react-native-svg is unable to render certain svgs

### @walletconnect+logger+2.1.2.patch

logger in wallet connect is hard coded to trace. this patch adjusts it to "error" level for local development and "silent" level for production
https://github.com/WalletConnect/walletconnect-utils/issues/171

### react-native-reanimated+3.17.1.patch

invalid call of hasAnimatedRef method will cause a crash. it is fixed but not released yet.
https://github.com/software-mansion/react-native-reanimated/pull/7158

### react-native-collapsible-tab-view+8.0.0.patch

perf improvement
https://github.com/PedroBern/react-native-collapsible-tab-view/pull/461

### react-native-webview-crypto+0.0.26.patch

with the latest react native, if the webview is not rendered using `display: none`, nothing will work: all the javascript injection, message relaying,...

to fix it, we patched the lib so that the webview is still rendered but won't be visible.

### @datadog+mobile-react-native+2.6.4.patch

we can't build Android with this version of datadog. they have fixed this in 2.6.5 but haven't released yet.
