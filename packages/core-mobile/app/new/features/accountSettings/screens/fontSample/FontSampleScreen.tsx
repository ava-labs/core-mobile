import { Text, View, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { i18n } from 'i18n'
import React, { useEffect, useState } from 'react'
import {
  FONT_SAMPLE_KEYS,
  FONT_SAMPLE_LANGUAGES,
  FONT_SAMPLE_VARIANTS
} from './fontSampleData'

/**
 * Dev/QA screen (CP-14859) for verifying OS system-font fallback of CJK +
 * Devanagari glyphs. Renders each script-bearing catalog's real strings (via
 * getFixedT — no global language change) across the k2-alpine Text variants,
 * which hard-code Latin-only families, so the fallback path is exercised.
 */
export const FontSampleScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // ensure every sample locale's catalog is in the i18n store so getFixedT
    // returns real translations (non-active locales load lazily via the
    // synchronous RequireBackend)
    i18n
      .loadLanguages(FONT_SAMPLE_LANGUAGES.map(l => l.code))
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  return (
    <ScrollScreen
      title="Font sample"
      subtitle="CJK / Devanagari OS-fallback rendering check (i18n QA)"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      {ready ? (
        <View sx={{ marginTop: 16, gap: 28 }}>
          {FONT_SAMPLE_LANGUAGES.map(lang => {
            const t = i18n.getFixedT(lang.code)
            const sample = FONT_SAMPLE_KEYS.map(k => t(k)).join(' · ')
            const mixed = `AVAX · ${t('Send')} · 0.5`
            return (
              <View key={lang.code} sx={{ gap: 8 }}>
                <Text variant="heading6">
                  {lang.label} ({lang.code})
                </Text>
                {FONT_SAMPLE_VARIANTS.map(v => (
                  <View key={v.variant} sx={{ gap: 2 }}>
                    <Text
                      variant="caption"
                      sx={{ color: colors.$textSecondary }}>
                      {v.variant} · {v.family}
                    </Text>
                    <Text variant={v.variant}>{sample}</Text>
                  </View>
                ))}
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
