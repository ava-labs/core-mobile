import { Text, useTheme, View } from '@avalabs/k2-alpine'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'

// Keep digits and at most one decimal point (parseFloat would silently accept
// "1.2.3" as 1.2, leaving the visible text and the committed value diverged).
const sanitizeNumeric = (raw: string): string => {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, '')
  )
}

type FilterNumberInputProps = {
  /** Left-hand label, e.g. "Fee" or "Amount". */
  label: string
  /** Right-hand unit suffix, e.g. "%" or "AVAX". */
  unit: string
  value: number
  min: number
  max?: number
  /** Formats the committed value for display (e.g. fixed decimals). */
  format: (value: number) => string
  onChange: (value: number) => void
}

/**
 * Inline numeric entry row used by the advanced filters for "Max delegation
 * fee" and "Min available delegation" (mirrors core-web, which uses numeric
 * inputs rather than sliders for these). The user types freely; the value is
 * sanitized, clamped to `[min, max]`, and committed on blur / submit. The field
 * stays in sync with external `value` changes (e.g. a reset) except while the
 * user is actively editing, so a keystroke is never clobbered mid-entry.
 */
export const FilterNumberInput: FC<FilterNumberInputProps> = ({
  label,
  unit,
  value,
  min,
  max,
  format,
  onChange
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const [text, setText] = useState(() => format(value))
  // While focused, the user "owns" the field — external `value` updates (which
  // our own `onChange` triggers on every keystroke) must not overwrite what's
  // being typed. Tracked in a ref so it doesn't cause re-renders.
  const isEditing = useRef(false)

  // Reflect external `value` changes (e.g. a reset) into the field, but never
  // mid-edit. A no-op when the formatted value already matches.
  useEffect(() => {
    if (!isEditing.current) setText(format(value))
  }, [value, format])

  // Commit live on every keystroke so the draft always reflects the typed
  // value — otherwise tapping "Apply" (or reopening) before the field blurs
  // would persist the stale seeded value. Clamp to `[min, max]` here too so an
  // out-of-range entry (e.g. a fee below the network floor) is never stored,
  // which would otherwise revert to the bound on reopen. The text field keeps
  // the raw input, so typing multi-digit numbers still works.
  const handleChangeText = useCallback(
    (next: string): void => {
      const sanitized = sanitizeNumeric(next)
      setText(sanitized)
      const parsed = parseFloat(sanitized)
      let live = Number.isFinite(parsed) ? parsed : min
      live = Math.max(min, live)
      if (max !== undefined) live = Math.min(live, max)
      onChange(live)
    },
    [min, max, onChange]
  )

  const handleFocus = useCallback((): void => {
    isEditing.current = true
  }, [])

  // Normalise + clamp on blur / submit for display.
  const commit = useCallback((): void => {
    isEditing.current = false
    const parsed = parseFloat(text)
    let next = Number.isFinite(parsed) ? parsed : min
    next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    setText(format(next))
    onChange(next)
  }, [text, min, max, format, onChange])

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
      <Text variant="body1" sx={{ color: '$textSecondary' }}>
        {label}
      </Text>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: unit === '%' ? 0 : 4
        }}>
        <TextInput
          value={text}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          textAlign="right"
          allowFontScaling={false}
          selectionColor={colors.$textPrimary}
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            color: colors.$textSecondary,
            minWidth: 44,
            padding: 0
          }}
        />
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          {unit}
        </Text>
      </View>
    </View>
  )
}
