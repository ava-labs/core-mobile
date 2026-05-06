import React, { FC, memo, useEffect, useRef, useState } from 'react'
import { Platform, Pressable, TextInput, TextStyle } from 'react-native'
import {
  Canvas,
  Group,
  Text as SkText,
  useFont
} from '@shopify/react-native-skia'
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { Button } from '../Button/Button'
import {
  commitDraftText,
  formatNumber,
  resolvePreset,
  sanitizeTypedText,
  snapToStep
} from './helpers'
import type { Preset } from './types'
import { useSkiaCanvasFadeIn } from './useSkiaCanvasFadeIn'

type LeverageDisplayProps = {
  value: number
  /** Live wheel position — display updates on every tick crossing. */
  currentValue: SharedValue<number>
  /** True while the wheel is in a user-initiated motion (drag/decay/settle). */
  isActive: SharedValue<boolean>
  min: number
  max: number
  step: number
  /** Number of decimal places to render in the displayed value. */
  decimals: number
  /** Restrict the input to integers (digit-only keyboard + input filter). */
  integersOnly: boolean
  presets: Preset[]
  subtitle: string
  formatValue: (v: number) => string
  enableManualInput: boolean
  onPresetPress?: (v: number) => void
  onManualCommit?: (v: number) => void
}

const noop = (): void => undefined

const LeverageDisplayInner: FC<LeverageDisplayProps> = ({
  value,
  currentValue,
  isActive,
  min,
  max,
  step,
  decimals,
  integersOnly,
  presets,
  subtitle,
  formatValue,
  enableManualInput,
  onPresetPress = noop,
  onManualCommit = noop
}) => {
  const {
    theme: { colors }
  } = useTheme()

  // Draft is null when not editing; non-null while the TextInput is focused
  // so user keystrokes aren't clobbered by wheel-driven sync.
  const [draft, setDraft] = useState<string | null>(null)
  // When non-null, forces the TextInput's cursor to this selection. Used to
  // pin the caret to the end when a wheel swipe overwrites the draft.
  const [forcedSelection, setForcedSelection] = useState<{
    start: number
    end: number
  } | null>(null)
  // Live value at every step crossing — kept in a ref so wheel-driven
  // updates don't re-render the display (which would flicker the Skia
  // canvas). The `value` prop intentionally lags during decay to avoid
  // flooding the JS queue from LeverageWheel.
  const liveValueRef = useRef<number>(value)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    liveValueRef.current = value
  }, [value])

  const maxStepIndex = Math.round((max - min) / step)

  // Keeps JS draft state in sync with the wheel while editing so handleBlur
  // commits the right value. The *visible* text is driven on the UI thread
  // via useAnimatedProps, so this setState can be slow without visible lag.
  const syncFromWheel = (snapped: number, swept: boolean): void => {
    liveValueRef.current = snapped
    if (!swept) return
    if (!inputRef.current?.isFocused()) return
    const next = formatNumber(snapped, decimals)
    setDraft(next)
    setForcedSelection({ start: next.length, end: next.length })
  }

  useAnimatedReaction(
    // Clamp to legal range so rubber-band overdrag doesn't flash out-of-bounds
    // values in the display.
    () => {
      const raw = Math.round((currentValue.value - min) / step)
      if (raw < 0) return 0
      if (raw > maxStepIndex) return maxStepIndex
      return raw
    },
    (stepIndex, prev) => {
      if (prev === null || stepIndex === prev) return
      const snapped = snapToStep(min + stepIndex * step, min, step)
      scheduleOnRN(syncFromWheel, snapped, isActive.value)
    }
  )

  const handleChangeText = (text: string): void => {
    // User is typing — release any caret pin from a prior wheel swipe so the
    // cursor position is free again.
    setForcedSelection(null)
    const next = sanitizeTypedText(text, { integersOnly, max })
    setDraft(next)
    // Live-move the wheel as the user types, so the gauge tracks the input.
    if (next === '' || next === '-' || next === '.') return
    const val = Number(next)
    if (!Number.isFinite(val)) return
    currentValue.value = withTiming(Math.min(Math.max(val, min), max), {
      duration: 200
    })
  }

  const handleFocus = (): void => {
    const next = formatNumber(liveValueRef.current, decimals)
    setDraft(next)
    // Pin the caret at the end of the text so pressing into edit mode
    // doesn't select-all; the user can just keep typing to append.
    setForcedSelection({ start: next.length, end: next.length })
  }

  const handleBlur = (): void => {
    if (draft !== null) {
      const committed = commitDraftText(draft, { min, max, step })
      if (committed !== null) onManualCommit(committed)
    }
    setDraft(null)
    setForcedSelection(null)
  }

  const startEdit = (): void => {
    if (!enableManualInput) return
    setDraft(formatNumber(liveValueRef.current, decimals))
    // Focus request runs after re-render has swapped in the TextInput.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const bigTextStyle: TextStyle = {
    fontFamily: 'Aeonik-Medium',
    fontSize: 60,
    lineHeight: 62,
    color: colors.$textPrimary
  }

  const isEditing = draft !== null

  // Drives the focused TextInput's text on the UI thread, so fast swipes
  // update the visible value without JS-thread dispatch lag. Only active
  // while isActive (wheel motion) — user typing must not be overwritten.
  const editingAnimatedProps = useAnimatedProps(() => {
    if (!isActive.value) {
      // Empty object → no props overridden, user's controlled value wins.
      return {} as { text?: string; defaultValue?: string }
    }
    const raw = currentValue.value
    const clamped = raw < min ? min : raw > max ? max : raw
    const stepIndex = Math.round((clamped - min) / step)
    const rawSnapped = min + stepIndex * step
    const snapped = min + Number((rawSnapped - min).toFixed(decimals))
    const textValue = decimals > 0 ? snapped.toFixed(decimals) : `${snapped}`
    return { text: textValue, defaultValue: textValue }
  })

  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row'
      }}>
      <Button
        type="secondary"
        size="small"
        onPress={() => onPresetPress(min)}
        testID="leverage-gauge-min">
        Min
      </Button>

      {presets.map((preset, index) => {
        if (preset === 'min' || preset === 'max') return null
        const resolved = resolvePreset(preset, min, max)
        return (
          <Button
            key={`preset-${index}-${resolved}`}
            type="tertiary"
            size="small"
            onPress={() => onPresetPress(resolved)}
            testID={`leverage-gauge-preset-${resolved}`}>
            {formatValue(resolved)}
          </Button>
        )
      })}

      <View style={{ flex: 1, alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            position: 'relative',
            minHeight: 80
          }}>
          {/* Always in flow — when editing, the TextInput overlays it with
              an opaque background while the Skia canvas keeps painting, so
              its derived values stay live regardless of focus. */}
          <Pressable
            onPress={startEdit}
            disabled={!enableManualInput || isEditing}
            testID="leverage-gauge-value">
            <AnimatedNumber
              currentValue={currentValue}
              min={min}
              max={max}
              step={step}
              decimals={decimals}
              integersOnly={integersOnly}
            />
          </Pressable>
          {isEditing && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 19,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.$surfaceSecondary
              }}>
              <AnimatedTextInput
                ref={inputRef}
                value={draft ?? ''}
                animatedProps={editingAnimatedProps}
                onChangeText={handleChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onSubmitEditing={handleBlur}
                editable={enableManualInput}
                keyboardType={integersOnly ? 'number-pad' : 'decimal-pad'}
                selection={forcedSelection ?? undefined}
                allowFontScaling={false}
                cursorColor={colors.$textPrimary}
                selectionHandleColor={colors.$textPrimary}
                style={{
                  ...bigTextStyle,
                  letterSpacing: Platform.OS === 'ios' ? -1 : -3,
                  padding: 0,
                  textAlign: 'center'
                }}
                testID="leverage-gauge-value-input"
              />
              <Text
                allowFontScaling={false}
                style={{
                  ...bigTextStyle,
                  bottom: Platform.OS === 'ios' ? 4.25 : 0.7,
                  left: Platform.OS === 'ios' ? 0.4 : 1.5
                }}>
                ×
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 13,
            lineHeight: 16,
            marginTop: 8,
            color: colors.$textPrimary
          }}>
          {subtitle}
        </Text>
      </View>

      <Button
        type="secondary"
        size="small"
        onPress={() => onPresetPress(max)}
        testID="leverage-gauge-max">
        Max
      </Button>
    </View>
  )
}

// Bails on identical-props renders so wheel swipes don't churn the Skia
// canvas + many derived values on every parent re-render.
export const LeverageDisplay = memo(LeverageDisplayInner)

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const NUMBER_CANVAS_HEIGHT = 80
const NUMBER_FONT_SIZE = 60
const NUMBER_BASELINE_Y = 64
// × sits optically higher than numerals in Aeonik — nudge it down to align
// with the digit baseline.
const X_VERTICAL_OFFSET = 0
const X_GAP = 2.2

type SkFont = NonNullable<ReturnType<typeof useFont>>
const AnimatedNumber: FC<{
  currentValue: SharedValue<number>
  min: number
  max: number
  step: number
  decimals: number
  integersOnly: boolean
}> = ({ currentValue, min, max, step, decimals, integersOnly }) => {
  const {
    theme: { colors }
  } = useTheme()
  const font = useFont(
    require('../../assets/fonts/Aeonik-Medium.otf'),
    NUMBER_FONT_SIZE
  )

  const canvasStyle = useSkiaCanvasFadeIn(!!font)

  const slotCount = React.useMemo(() => {
    const widest = decimals > 0 ? `${max}.${'0'.repeat(decimals)}` : `${max}`
    return widest.length
  }, [max, decimals])

  const canvasWidth = React.useMemo(() => {
    if (!font) return 1
    const widest = decimals > 0 ? `${max}.${'0'.repeat(decimals)}` : `${max}`
    const w = font.measureText(widest + '×').width
    return Math.ceil(w) + 4
  }, [font, max, decimals])
  // Cached so the UI-thread layout derived value doesn't measureText per frame.
  const xGlyphWidth = React.useMemo(
    () => (font ? font.measureText('×').width : 0),
    [font]
  )

  const layout = useDerivedValue(() => {
    const raw = currentValue.value
    const clamped = raw < min ? min : raw > max ? max : raw
    const maxStepIdx = Math.round((max - min) / step)
    const rawIdx = Math.round((clamped - min) / step)
    const stepIndex = Math.max(0, Math.min(maxStepIdx, rawIdx))
    const snappedValue = min + stepIndex * step

    // Direction of the "approaching" neighbor snap — determines which char
    // at each slot is about to become this slot's char.
    const neighborOffset = clamped > snappedValue ? 1 : -1
    const neighborIdx = Math.max(
      0,
      Math.min(maxStepIdx, stepIndex + neighborOffset)
    )

    const formatSnapped = (idx: number): string => {
      const rs = min + idx * step
      const s = min + Number((rs - min).toFixed(decimals))
      return decimals > 0 ? s.toFixed(decimals) : `${s}`
    }
    const currentText = formatSnapped(stepIndex)
    const neighborText = formatSnapped(neighborIdx)

    // How far we are between current snap and neighbor snap: 0 at snap,
    // 1 at the boundary midpoint.
    const distFromSnap = Math.abs(clamped - snappedValue)
    const fadeProgress = Math.min(distFromSnap / (step / 2), 1)

    const chars: string[] = []
    const neighborChars: string[] = []
    const widths: number[] = []
    let numberWidth = 0
    for (let i = 0; i < slotCount; i++) {
      const ch = currentText[i] ?? ''
      const nch = neighborText[i] ?? ''
      chars.push(ch)
      neighborChars.push(nch)
      const w = ch && font ? font.measureText(ch).width : 0
      widths.push(w)
      numberWidth += w
    }
    const totalWidth = numberWidth + X_GAP + xGlyphWidth
    const startX = (canvasWidth - totalWidth) / 2
    const xs: number[] = []
    let cursor = startX
    for (let i = 0; i < slotCount; i++) {
      xs.push(cursor)
      cursor += widths[i] ?? 0
    }
    const xSymbolX = startX + numberWidth + X_GAP
    return { chars, neighborChars, xs, xSymbolX, fadeProgress }
  })

  // × target x — smoothed so it slides gently when the number width changes.
  // Direction matters: when the number gets shorter (digit dropped) × glides
  // left slowly; when it gets longer (digit added) × snaps right so it's
  // already in place by the time the new digit fades in.
  const xSymbolTargetX = useDerivedValue(() => layout.value.xSymbolX)
  const xSymbolX = useSharedValue(xSymbolTargetX.value)
  useAnimatedReaction(
    () => xSymbolTargetX.value,
    (next, prev) => {
      if (prev === null || Math.abs(next - prev) < 0.5) {
        xSymbolX.value = next
        return
      }
      // Snap instantly when × needs to move right (number got wider — a
      // digit was added). Glide slowly when moving left (digit dropped).
      const isMovingRight = next > prev
      if (isMovingRight) {
        xSymbolX.value = next
        return
      }
      xSymbolX.value = withTiming(next, {
        duration: 500,
        easing: Easing.out(Easing.cubic)
      })
    }
  )

  if (!font) return null

  return (
    // Canvas opacity is driven by readiness: fades in only once the font
    // is resolved and two RAFs have confirmed a first paint.
    <Animated.View style={canvasStyle}>
      <Canvas
        pointerEvents="none"
        style={{
          width: canvasWidth,
          height: NUMBER_CANVAS_HEIGHT,
          marginRight: 4
        }}>
        {Array.from({ length: slotCount }).map((_, i) => (
          <DigitSlot
            key={i}
            index={i}
            layout={layout}
            font={font}
            color={colors.$textPrimary}
            integersOnly={integersOnly}
          />
        ))}
        <SkText
          text="×"
          x={xSymbolX}
          y={NUMBER_BASELINE_Y + X_VERTICAL_OFFSET}
          font={font}
          color={colors.$textPrimary}
        />
      </Canvas>
    </Animated.View>
  )
}

/**
 * A single Skia digit slot. Opacity fades progressively only on decimal
 * digits (slots after the ".") when integersOnly is false. Integer digits
 * and all slots in integersOnly mode stay at full opacity.
 */
const DIGIT_MIN_OPACITY = 0.2
const DigitSlot: FC<{
  index: number
  layout: SharedValue<{
    chars: string[]
    neighborChars: string[]
    xs: number[]
    xSymbolX: number
    fadeProgress: number
  }>
  font: SkFont
  color: string
  integersOnly: boolean
}> = ({ index, layout, font, color, integersOnly }) => {
  const char = useDerivedValue(() => layout.value.chars[index] ?? '')
  const x = useDerivedValue(() => layout.value.xs[index] ?? 0)
  const opacity = useDerivedValue(() => {
    if (integersOnly) return 1
    const chars = layout.value.chars
    // Only fade digits to the right of the decimal point. Integer digits
    // and the "." itself never fade.
    const dotIndex = chars.indexOf('.')
    if (dotIndex === -1 || index <= dotIndex) return 1
    const cur = chars[index] ?? ''
    const nxt = layout.value.neighborChars[index] ?? ''
    if (cur === nxt) return 1
    if (cur === '' || nxt === '') return 1
    return 1 - layout.value.fadeProgress * (1 - DIGIT_MIN_OPACITY)
  })
  return (
    <Group opacity={opacity}>
      <SkText
        text={char}
        x={x}
        y={NUMBER_BASELINE_Y}
        font={font}
        color={color}
      />
    </Group>
  )
}
