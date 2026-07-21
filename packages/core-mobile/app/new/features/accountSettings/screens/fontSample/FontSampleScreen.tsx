import { Text, View, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { i18n } from 'i18n'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'
import {
  FONT_SAMPLE_KEYS,
  FONT_SAMPLE_LANGUAGES,
  FONT_SAMPLE_VARIANTS,
  RELAXED_LINE_HEIGHT_RATIO
} from './fontSampleData'

/**
 * Dev/QA screen (CP-14859) for verifying OS system-font fallback of CJK +
 * Devanagari glyphs. Renders each script-bearing catalog's real strings (via
 * getFixedT — no global language change) across the k2-alpine Text variants,
 * which hard-code Latin-only families, so the fallback path is exercised.
 */
export const FontSampleScreen = (): React.JSX.Element => {
  const { theme } = useTheme()
  const { colors, text } = theme
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [ready, setReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    // only load when the screen is actually usable (dev/testnet mode); hooks
    // must run unconditionally, so guard inside the effect rather than skipping
    // the hook
    if (!isDeveloperMode) return
    let mounted = true
    // ensure every sample locale's catalog is in the i18n store so getFixedT
    // returns real translations (non-active locales load lazily via the
    // synchronous RequireBackend)
    i18n
      .loadLanguages(FONT_SAMPLE_LANGUAGES.map(l => l.code))
      .then(() => {
        // guard against a setState after the screen unmounts if the load
        // settles late
        if (mounted) setReady(true)
      })
      .catch((err: unknown) => {
        // surface (don't swallow) a catalog load failure — otherwise the
        // screen would render English fallbacks and read as a passing font
        // check
        Logger.error('[FontSample] failed to load locale catalogs', err)
        if (mounted) {
          setLoadFailed(true)
          setReady(true)
        }
      })
    return () => {
      mounted = false
    }
  }, [isDeveloperMode])

  // Gate the route itself, not just the Advanced Settings entry point — the
  // screen is deep-linkable, and it's meant to be a developer-only QA tool.
  if (!isDeveloperMode) {
    return (
      <ScrollScreen
        title="Font sample"
        isModal
        contentContainerStyle={{ padding: 16 }}>
        <Text variant="body1" sx={{ marginTop: 16 }}>
          Enable Testnet mode in Settings to view the font sample
          (developer-only QA tool).
        </Text>
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      title="Font sample"
      subtitle="CJK / Devanagari OS-fallback rendering check (i18n QA)"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      {ready ? (
        <View sx={{ marginTop: 16, gap: 28 }}>
          {loadFailed && (
            <Text variant="body2">
              ⚠️ Some locale catalogs failed to load — glyphs below may be
              English fallbacks, not a font-rendering result. Check logs.
            </Text>
          )}
          <Text variant="body2" sx={{ color: colors.$textSecondary }}>
            Each variant is shown twice: “as-is” uses the k2-alpine token
            lineHeight (which on several variants equals fontSize and clips
            CJK/Devanagari on iOS — see each row’s labelled value); “relaxed”
            uses {RELAXED_LINE_HEIGHT_RATIO}× fontSize. Compare to choose
            per-variant lineHeights that fit non-Latin scripts.
          </Text>
          {FONT_SAMPLE_LANGUAGES.map(lang => {
            const t = i18n.getFixedT(lang.code)
            const sample = FONT_SAMPLE_KEYS.map(k => t(k)).join(' · ')
            const mixed = `AVAX · ${t('Send')} · 0.5`
            return (
              <View key={lang.code} sx={{ gap: 8 }}>
                <Text variant="heading6">
                  {lang.label} ({lang.code})
                </Text>
                {FONT_SAMPLE_VARIANTS.map(variant => {
                  const spec = text[variant]
                  // ceil, not round — never let the "relaxed" lineHeight fall
                  // below the intended ratio (which could reintroduce clipping)
                  const relaxed = Math.ceil(
                    spec.fontSize * RELAXED_LINE_HEIGHT_RATIO
                  )
                  return (
                    <View key={variant} sx={{ gap: 2 }}>
                      <Text
                        variant="caption"
                        sx={{ color: colors.$textSecondary }}>
                        {variant} · {spec.fontFamily} {spec.fontSize} · as-is
                        (lineHeight {spec.lineHeight})
                      </Text>
                      <Text variant={variant}>{sample}</Text>
                      <Text
                        variant="caption"
                        sx={{ color: colors.$textSecondary }}>
                        relaxed (lineHeight {relaxed})
                      </Text>
                      <Text variant={variant} sx={{ lineHeight: relaxed }}>
                        {sample}
                      </Text>
                    </View>
                  )
                })}
                <View sx={{ gap: 2 }}>
                  <Text variant="caption" sx={{ color: colors.$textSecondary }}>
                    mixed (Latin + script) · body1
                  </Text>
                  <Text variant="body1">{mixed}</Text>
                </View>
              </View>
            )
          })}
        </View>
      ) : (
        <Text variant="body1" sx={{ marginTop: 16 }}>
          Loading locale catalogs…
        </Text>
      )}
    </ScrollScreen>
  )
}
