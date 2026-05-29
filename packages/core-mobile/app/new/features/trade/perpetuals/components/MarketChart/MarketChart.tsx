import React, { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import RNWebView from 'react-native-webview'
import { CHART_HTML } from './chartHtml'

interface MarketChartProps {
  /** Hyperliquid coin symbol (e.g. `'BTC'`). Passed to the embedded TradingView widget. */
  coin: string
  /** TradingView color theme. Driven by the host RN theme (light / dark). */
  theme: 'light' | 'dark'
  /** Surface color the chart should paint behind its panes (typically `$surfacePrimary`). */
  surfaceColor: string
  /**
   * TradingView resolution code (e.g. `'60'`, `'1D'`, `'1W'`). Used as the
   * widget's initial interval; subsequent changes are pushed via
   * `setResolution()` instead of re-creating the widget.
   */
  resolution: string
  style?: ViewStyle
}

export const MarketChart = ({
  coin,
  theme,
  surfaceColor,
  resolution,
  style
}: MarketChartProps): JSX.Element => {
  const ref = useRef<RNWebView | null>(null)
  // Track the resolution baked into the current widget mount so the
  // setResolution effect skips on the initial render (the widget is already
  // constructed with INITIAL_RES, we'd just call setResolution() with the
  // value it already has).
  const mountedResolutionRef = useRef(resolution)

  useEffect(() => {
    if (resolution === mountedResolutionRef.current) return
    ref.current?.injectJavaScript(`
      (function () {
        var w = window.tvWidget;
        if (!w) return;
        try { w.activeChart().setResolution(${JSON.stringify(resolution)}); } catch (_) {}
      })();
      true;
    `)
  }, [resolution])

  // Pass coin + theme + bg + res via the URL hash so the HTML can read them
  // without setting up a postMessage bridge. baseUrl pins the document origin
  // so TradingView resolves its relative bundle paths against
  // `charting.core.app`.
  //
  // IMPORTANT: `resolution` is read here for the initial boot of each WebView
  // mount only — we deliberately exclude it from the memo deps so subsequent
  // resolution changes don't mutate `source.baseUrl`. Android's WebView
  // reloads the page when `baseUrl` changes (iOS is lazier), which would
  // flash the chart on every range tap. Live resolution updates go through
  // `injectJavaScript` instead (see the effect below).
  const source = useMemo(
    () => ({
      html: CHART_HTML,
      baseUrl:
        `https://charting.core.app/` +
        `#coin=${encodeURIComponent(coin)}` +
        `&theme=${encodeURIComponent(theme)}` +
        `&bg=${encodeURIComponent(surfaceColor)}` +
        `&res=${encodeURIComponent(resolution)}`
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coin, theme, surfaceColor]
  )

  return (
    <RNWebView
      // Force a remount on coin/theme/surface change so the TV widget
      // rebuilds with a fresh datafeed and palette instead of trying to
      // mutate the live instance. Resolution changes go through
      // injectJavaScript, not a remount.
      key={`${coin}:${theme}:${surfaceColor}`}
      ref={ref}
      originWhitelist={['*']}
      source={source}
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
    />
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  }
})
