import {
  RESOLUTION_TO_INTERVAL,
  TV_RESOLUTIONS,
  type TvResolution
} from '@avalabs/perps-sdk'
import { Asset } from 'expo-asset'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import RNWebView from 'react-native-webview'

// Static HTML bundle loaded from disk. Metro registers `.html` as an asset
// (see metro.config.js), `expo-asset` resolves it to a local file URI.
const chartHtmlAsset = Asset.fromModule(require('./index.html'))

// Pre-warm the asset at module-load time so navigating to the detail screen
// in a release build doesn't pay the download cost on first render.
void chartHtmlAsset.downloadAsync().catch(() => {})

// SDK constants injected into the WebView before its inline script runs.
// The HTML reads them off `window.__PERPS_*`.
const PRELOAD_JS = `
  window.__PERPS_TV_RESOLUTIONS = ${JSON.stringify(TV_RESOLUTIONS)};
  window.__PERPS_RES_TO_INTERVAL = ${JSON.stringify(RESOLUTION_TO_INTERVAL)};
  true;
`

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

  if (!sourceUri) return null

  return (
    <RNWebView
      key={`${coin}:${theme}:${surfaceColor}:${pricescale ?? ''}`}
      ref={ref}
      originWhitelist={['*']}
      source={{ uri: sourceUri }}
      injectedJavaScriptBeforeContentLoaded={PRELOAD_JS}
      style={[styles.webview, { backgroundColor: surfaceColor }, style]}
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
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
    />
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  }
})
