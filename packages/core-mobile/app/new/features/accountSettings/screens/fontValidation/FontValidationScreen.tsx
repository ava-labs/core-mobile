import { Chip, Text, View, useTheme } from '@avalabs/k2-alpine'
import { DropdownMenu } from 'common/components/DropdownMenu'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  FONT_VALIDATION_SAMPLES,
  FONT_VALIDATION_VARIANTS
} from './fontValidationData'

// Default to a tall-script locale so the CJK/Devanagari lineHeight fix is
// visible the moment the screen opens.
const DEFAULT_CODE = 'zh-CN'

/**
 * Dev/QA screen (CP-14859) for validating post-fix text rendering across the 11
 * supported locales. Pick a language from the dropdown and a curated stress
 * paragraph (tall glyphs, diacritics, script punctuation, mixed Latin/number/
 * currency) renders across a spread of k2-alpine Text variants — the primitive
 * applies the per-script lineHeight automatically, so what you see is the
 * shipped ("as-is") result, no comparison row.
 */
export const FontValidationScreen = (): React.JSX.Element => {
  const { theme } = useTheme()
  const { colors, text } = theme
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [code, setCode] = useState<string>(DEFAULT_CODE)

  const selected =
    FONT_VALIDATION_SAMPLES.find(s => s.code === code) ??
    FONT_VALIDATION_SAMPLES[0]

  const groups = useMemo(
    () => [
      {
        key: 'languages',
        items: FONT_VALIDATION_SAMPLES.map(s => ({
          id: s.code,
          title: `${s.label} (${s.code})`,
          selected: s.code === code
        }))
      }
    ],
    [code]
  )

  // Gate the route itself (it's deep-linkable), not just the Advanced Settings
  // entry point — this is a developer-only QA tool.
  if (!isDeveloperMode) {
    return (
      <ScrollScreen
        title="Font validation"
        isModal
        contentContainerStyle={{ padding: 16 }}>
        <Text variant="body1" sx={{ marginTop: 16 }}>
          Enable Testnet mode in Settings to view font validation
          (developer-only QA tool).
        </Text>
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      title="Font validation"
      subtitle="Per-language rendering check across text variants (i18n QA)"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ marginTop: 16, gap: 20 }}>
        <DropdownMenu
          groups={groups}
          onPressAction={(event: { nativeEvent: { event: string } }) =>
            setCode(event.nativeEvent.event)
          }>
          <Chip
            size="large"
            hitSlop={8}
            rightIcon="expandMore"
            style={{ alignSelf: 'flex-start' }}>
            {`${selected?.label} (${selected?.code})`}
          </Chip>
        </DropdownMenu>

        {selected &&
          FONT_VALIDATION_VARIANTS.map(variant => {
            const spec = text[variant]
            return (
              <View key={variant} sx={{ gap: 4 }}>
                <Text variant="caption" sx={{ color: colors.$textSecondary }}>
                  {variant} · {spec.fontFamily} {spec.fontSize}
                </Text>
                <Text variant={variant}>{selected.paragraph}</Text>
              </View>
            )
          })}
      </View>
    </ScrollScreen>
  )
}
