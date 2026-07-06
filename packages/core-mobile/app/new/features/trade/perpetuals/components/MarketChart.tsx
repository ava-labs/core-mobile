import {
  MAINNET_API_URL,
  MAINNET_WS_URL,
  RESOLUTION_TO_INTERVAL,
  TV_RESOLUTIONS,
  type TvResolution
} from '@avalabs/perps-sdk'
import { Asset } from 'expo-asset'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import RNWebView, {
  type WebViewMessageEvent,
  type WebViewNavigation
} from 'react-native-webview'

// Static HTML bundle loaded from disk. Metro registers `.html` as an asset
// (see metro.config.js), `expo-asset` resolves it to a local file URI.
const chartHtmlAsset = Asset.fromModule(require('./tradingview.html'))

// Pre-warm the asset at module-load time so navigating to the detail screen
// in a release build doesn't pay the download cost on first render.
// eslint-disable-next-line no-void, @typescript-eslint/no-empty-function
void chartHtmlAsset.downloadAsync().catch(() => {})

// SDK constants injected into the WebView before its inline script runs.
// The HTML reads them off `window.__PERPS_*`.
// TODO: the datafeed is pinned to mainnet Hyperliquid — it ignores the app's
// network mode, so the chart shows mainnet data even in testnet. The SDK
// doesn't expose testnet endpoints yet; make these network-aware when the real
// data wiring lands (CP-14338).
const PRELOAD_JS = `
  window.__PERPS_TV_RESOLUTIONS = ${JSON.stringify(TV_RESOLUTIONS)};
  window.__PERPS_RES_TO_INTERVAL = ${JSON.stringify(RESOLUTION_TO_INTERVAL)};
  window.__PERPS_API_URL = ${JSON.stringify(MAINNET_API_URL)};
  window.__PERPS_WS_URL = ${JSON.stringify(MAINNET_WS_URL)};
  true;
`

const CHART_READY_MESSAGE = 'chart-ready'

// Origin the TradingView charting library is served from. Its in-page chart is
// rendered in a dynamically-created iframe whose navigation must be allowed.
const CHART_LIB_ORIGIN = 'https://charting.core.app'

interface MarketChartProps {
  coin: string
  theme: 'light' | 'dark'
  surfaceColor: string
  /** Initial interval on mount; later changes are injected via `setResolution`. */
  resolution: TvResolution
  /**
   * TradingView pricescale (10 ** pxDecimals). Drives axis-label precision
   * for the active market. Defaults to `100` (2 decimals) if undefined.
   */
  pricescale?: number
  style?: ViewStyle
}

export const MarketChart = ({
  coin,
  theme,
  surfaceColor,
  resolution,
  pricescale,
  style
}: MarketChartProps): JSX.Element | null => {
  const ref = useRef<RNWebView | null>(null)
  const mountedResolutionRef = useRef(resolution)
  const [bundleUri, setBundleUri] = useState<string | null>(
    chartHtmlAsset.localUri ?? chartHtmlAsset.uri ?? null
  )
  const [isChartReady, setIsChartReady] = useState(false)
  const chartOpacity = useSharedValue(0)

  const chartFadeStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value
  }))

  // In dev, `Asset.fromModule(...).uri` is already the Metro HTTP URL and is
  // ready immediately. In production, the file may need to be downloaded to
  // the device cache first before it has a `localUri`.
  useEffect(() => {
    if (bundleUri) return
    let cancelled = false
    chartHtmlAsset
      .downloadAsync()
      .then(() => {
        if (cancelled) return
        setBundleUri(chartHtmlAsset.localUri ?? chartHtmlAsset.uri ?? null)
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [bundleUri])

  useEffect(() => {
    // Wait for the widget: injecting before `chart-ready` is a no-op (the
    // script bails on a missing `window.tvWidget`). Re-running once ready
    // applies the latest resolution if the user changed range early.
    if (!isChartReady) return
    if (resolution === mountedResolutionRef.current) return
    ref.current?.injectJavaScript(`
      (function () {
        var w = window.tvWidget;
        if (!w) return;
        try { w.activeChart().setResolution(${JSON.stringify(
          resolution
        )}); } catch (_) {}
      })();
      true;
    `)
    mountedResolutionRef.current = resolution
  }, [resolution, isChartReady])

  // `resolution` is intentionally excluded from the memo deps: Android's
  // WebView reloads the page on any `source.uri` change (iOS doesn't), which
  // would flash the chart on every range tap. Resolution updates go through
  // `injectJavaScript` instead.
  const sourceUri = useMemo(() => {
    if (!bundleUri) return null
    const hash =
      `#coin=${encodeURIComponent(coin)}` +
      `&theme=${encodeURIComponent(theme)}` +
      `&bg=${encodeURIComponent(surfaceColor)}` +
      `&res=${encodeURIComponent(resolution)}` +
      (pricescale !== undefined ? `&px=${pricescale}` : '')
    return `${bundleUri}${hash}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleUri, coin, theme, surfaceColor, pricescale])

  // Reset the ready flag (and hide the chart again) whenever the WebView is
  // about to remount with a fresh coin / theme / surface / pricescale.
  useEffect(() => {
    setIsChartReady(false)
    chartOpacity.value = 0
  }, [coin, theme, surfaceColor, pricescale, chartOpacity])

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (event.nativeEvent.data === CHART_READY_MESSAGE) {
        setIsChartReady(true)
        chartOpacity.value = withTiming(1, { duration: 220 })
      }
    },
    [chartOpacity]
  )

  // Lock top-level navigation to the locally-bundled chart document. The
  // in-page datafeed reaches Hyperliquid over XHR/WebSocket, which do NOT
  // trigger this handler, so blocking other document loads can't break data
  // — it only stops the chart page from navigating away (or being redirected)
  // to an arbitrary origin. `about:blank` is allowed for TV's internal iframes.
  const handleShouldStartLoad = useCallback(
    (request: WebViewNavigation): boolean => {
      const url = request.url ?? ''
      // TradingView renders the chart inside an iframe it creates at runtime,
      // using `about:` (blank/srcdoc) and `blob:` documents — allow those, plus
      // inline `data:` URIs, or the widget never finishes initializing.
      if (
        url.startsWith('about:') ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
      ) {
        return true
      }
      // Allow the charting library's own origin (it loads bundle/font assets
      // and may navigate sub-frames to itself).
      if (url.startsWith(`${CHART_LIB_ORIGIN}/`) || url === CHART_LIB_ORIGIN) {
        return true
      }
      const base = bundleUri?.split('#')[0]
      const requested = url.split('#')[0] ?? ''
      // Exact match (ignoring the hash) so a sibling like `${base}evil.html`
      // can't slip past a prefix check.
      return base !== undefined && requested === base
    },
    [bundleUri]
  )

  if (!sourceUri) {
    return (
      <View
        style={[
          styles.webview,
          styles.center,
          { backgroundColor: surfaceColor },
          style
        ]}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={[styles.webview, { backgroundColor: surfaceColor }, style]}>
      <Animated.View style={[styles.webview, chartFadeStyle]}>
        <RNWebView
          key={`${coin}:${theme}:${surfaceColor}:${pricescale ?? ''}`}
          ref={ref}
          originWhitelist={['*']}
          source={{ uri: sourceUri }}
          injectedJavaScriptBeforeContentLoaded={PRELOAD_JS}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          style={[styles.webview, { backgroundColor: surfaceColor }]}
          containerStyle={[styles.webview, { backgroundColor: surfaceColor }]}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false}
          automaticallyAdjustContentInsets={false}
          androidLayerType="hardware"
          mixedContentMode="compatibility"
          cacheEnabled
          allowsInlineMediaPlayback
          // The chart bundle is served from a `file://` origin and its datafeed
          // makes cross-origin XHR/WS calls to Hyperliquid; these file-access
          // flags are required for that to work in release builds. Navigation
          // is locked down separately via `onShouldStartLoadWithRequest`.
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
        />
      </Animated.View>
      {!isChartReady ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.center,
            { backgroundColor: surfaceColor }
          ]}>
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})
