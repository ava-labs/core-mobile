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

### pino+10.0.0.patch

Calling pino({ level: 'error' }) will throw an error `Cannot assign to read only property 'error' of object`. The patch just replaces Object.create with Object.assign. Pino is the logger of Wallet Connect V2.

### @hpke+core+1.2.7.patch

for some reason, metro can only consume esm folder so we had to adjust the package.json to only expose esm folder

### react-native-svg+15.8.0.patch

to prevent a crash on iOS when react-native-svg is unable to render certain svgs

### @walletconnect+logger+2.1.2.patch

logger in wallet connect is hard coded to trace. this patch adjusts it to "error" level for local development and "silent" level for production
https://github.com/WalletConnect/walletconnect-utils/issues/171

### react-native-screens+4.21.0.patch

1/ CustomToolbar.kt

When Android `WindowInsets` reports `0` for the top system bar inset (common on emulators without a display cutout), the native header toolbar has no status bar padding. This patch adds a fallback that reads the `status_bar_height` system resource to ensure the header is always positioned below the status bar.

2/ SheetDelegate.kt

- `computeSheetOffsetYWithIMEPresent`: patched to always return `0` so the FormSheet does not shift upward when the keyboard appears. Keyboard positioning is handled by `react-native-keyboard-controller` at the content level instead.
- `handleKeyboardInsetsProgress`: no-op'd to prevent the FormSheet from translating based on keyboard inset changes, avoiding conflicts with `react-native-keyboard-controller`.

### react-native-reanimated+4.2.1.patch

added isActive prop for useAnimatedSensor

### react-native-collapsible-tab-view+9.0.0-rc.patch

exposed toggleSyncScrollFrame using scrollResync ref for manually recomputing layout

updated module to support react-native-reanimated 4 and react-native 0.81+

### react-native-webview-crypto+0.0.27.patch

with the latest react native, if the webview is not rendered using `display: none`, nothing will work: all the javascript injection, message relaying,...

to fix it, we patched the lib so that the webview is still rendered but won't be visible.

### @noble+hashes+1.8.0.patch

we replace several hash + key derivation functions with the ones from react-native-quick-crypto:

- hmacSHA512
- sha256
- sha512
- ripemd160
- pbkdf2Sync
- pbkdf2Async

### bip32+3.0.1.patch

we replace tiny-secp256k1 with @bitcoinerlab/secp256k1 (which uses @noble/secp256k1) and use that as the default ECC instance

### react-native-bottom-tabs+1.1.0.patch

we patched the tab selection handlers to allow native tab bars (iOS UITabBarController, Android BottomNavigationView) to handle selection directly, instead of routing everything through JS. this removes the extra JS roundtrip that caused visible delays/flicker.
https://github.com/callstackincubator/react-native-bottom-tabs/issues/383
https://github.com/callstackincubator/react-native-bottom-tabs/pull/408

Updated 1.1.0
we patched this to work with xcode 16.3 builds => Remove after we're building with xcode 26 on CI (est. March 2026)

### react-native-toast-notifications+3.4.0.patch

We patched this to fix /native-stack toast displaying on top of all screens.
You can wrap a toast container with a custom wrapper.

```js
<ToastProvider
    ToastContainerWrapper={{
      component: FooComponent,
      props: {style: { flex: 1}}
    }}
>
...
</>

// In order to display a toast over a native-stack modal, use [FullWindowOverlay component](https://github.com/software-mansion/react-native-screens?tab=readme-ov-file#fullwindowoverlay).
```

### @buoy-gg+shared-ui+2.1.1.patch

This patch fixes the "unable to resolve @buoy-gg/shared-ui/dataViewer" issue when Metro has `unstable_enablePackageExports: false` by mapping `./dataViewer` in `react-native` to `./lib/commonjs/dataViewer/index.js`. Please refer to https://github.com/LovesWorking/react-native-buoy/issues/46 for more info.

### react-native+0.81.5.patch

On iOS 26, `UIScrollEdgeEffect` adds a blur/gradient at scroll view edges (part of the Liquid Glass redesign). This creates an unwanted gradient overlay on content that scrolls behind the navigation bar — most visibly on the Portfolio screen's action buttons after switching tabs and scrolling back up. The patch hides `topEdgeEffect` on all scroll views on iOS 26+ via the official `isHidden` API. Gated behind `@available(iOS 26.0, *)` so older versions are unaffected.

1/ RCTEnhancedScrollView.mm — hides `topEdgeEffect` at scroll view creation (`initWithFrame:`)

2/ RCTScrollViewComponentView.mm — re-hides `topEdgeEffect` in `didMoveToWindow` when the scroll view becomes visible again (e.g. after tab switching, where iOS may re-enable the effect)

- https://github.com/facebook/react-native/issues/54181
- https://github.com/facebook/react-native/pull/55037
- https://developer.apple.com/documentation/uikit/uiscrolledgeeffect

### @shopify+flash-list+2.3.0.patch

Fixes a sticky header (`stickyHeaderIndices`) at index 0 disappearing on iOS top overscroll. This affects all `ListScreenV2` modals, which use `stickyHeaderConfig={{ hideRelatedCell: true }}`.

`StickyHeaders` only renders the overlay while `getLayout(stickyIndex).y (=0) <= scrollOffset + stickyHeaderOffset`. On an iOS top overscroll `scrollOffset` goes negative, so the binary search returns `-1`, the overlay returns `null`, and because `hideRelatedCell` also hides the in-flow cell, nothing renders — leaving an empty void where the header was. (Android uses stretch overscroll and keeps the offset `>= 0`, so it never hits this; the patch is a no-op there.)

`dist/recyclerview/components/StickyHeaders.js`:

1. Clamp the sticky-index lookup to `Math.max(0, getLastScrollOffset())` so index 0 stays the current sticky during overscroll and the overlay never nulls out. Only affects index selection; the push animation still uses `scrollY`.

2. Add an `overscrollTranslateY` (`scrollY.interpolate([-100000, 0] → [100000, 0]`, clamped) as a second `translateY` transform on the overlay, so when `scrollY` is negative the pinned header rubber-bands down 1:1 with the content instead of staying rigidly fixed at the top. Clamps to `0` for normal scroll.

Re-check on any `@shopify/flash-list` version bump (edits target `dist/`, since the package `main` is `dist/index.js`).
