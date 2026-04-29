import { useFont } from '@shopify/react-native-skia'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { TextInput } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { Text, View } from '../Primitives'
import {
  clamp,
  commitDraftText,
  sanitizeDecimalInput,
  valueToProgress
} from './helpers'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const INITIAL_FONT_SIZE = 50
const MIN_FONT_SIZE = 14
// Spans the arc's bottom-left to bottom-right endpoints (2 × ARC_RADIUS).
const AMOUNT_CANVAS_WIDTH = 220
// Inset on each side so the text doesn't visually touch the arc.
const AMOUNT_FIT_INSET = 20
const AMOUNT_FIT_WIDTH = AMOUNT_CANVAS_WIDTH - 2 * AMOUNT_FIT_INSET
const AMOUNT_WIDTH_PADDING = 4

// Label, input, and caption are pinned independently from the bottom so
// the input's auto-fit doesn't reposition its neighbours. With a
// caption rendered, the input + label shift up to clear it.
const INPUT_BOTTOM_NO_CAPTION = 32
const CAPTION_FONT_SIZE = 13
const CAPTION_LINE_HEIGHT = 16
const CAPTION_BOTTOM = 22
const INPUT_BOTTOM_WITH_CAPTION = CAPTION_LINE_HEIGHT + CAPTION_BOTTOM + 4

// Strips trailing zeros so `5` stays `"5"` and `5.5` stays `"5.5"`.
// Drag-time animated text uses raw `toFixed(decimals)` instead so the
// dial visibly snaps at step granularity.
const naturalDigits = (v: number, decimals: number): string => {
  if (decimals <= 0) return `${Math.round(v)}`
  return v.toFixed(decimals).replace(/\.?0+$/, '')
}

export type DialReadoutHandle = {
  /** Open the TextInput for manual editing. No-op when `enableManualInput` is false. */
  startEdit: () => void
}

type DialReadoutProps = {
  value: number
  max: number
  step: number
  decimals: number
  /** Cap on the number of decimal places the user can type. */
  maxDecimals?: number
  label?: string
  /** Placeholder shown inside the input when the user has cleared all digits. */
  placeholder?: string
  /** Optional small text rendered just below the amount. */
  caption?: string
  enableManualInput: boolean
  /**
   * When provided, values below the reference are considered invalid and
   * the amount text renders in the danger colour to flag that state.
   */
  referenceValue?: number
  progressSv: SharedValue<number>
  isActive: SharedValue<boolean>
  onChange: (v: number) => void
  onCommit: (v: number) => void
  /** Prefix for the input's `testID`. Falls back to `circular-dial`. */
  testIDPrefix?: string
}

/* eslint-disable sonarjs/cognitive-complexity --
 * The readout is intentionally a single coordinated unit. Auto-fit,
 * draft, animated-props, and danger-color paths share state heavily;
 * splitting them across hooks multiplies re-renders and indirection
 * without clear gain. */
export const DialReadout = forwardRef<DialReadoutHandle, DialReadoutProps>(
  (
    {
      value,
      max,
      step,
      decimals,
      maxDecimals,
      label,
      placeholder,
      caption,
      enableManualInput,
      referenceValue,
      progressSv,
      isActive,
      onChange,
      onCommit,
      testIDPrefix = 'circular-dial'
    },
    ref
  ) => {
    const {
      theme: { colors }
    } = useTheme()

    const [draft, setDraft] = useState<string | null>(null)
    const inputRef = useRef<TextInput>(null)
    const isEditing = draft !== null

    // Wider than step-derived `decimals` so typed precision beyond step
    // (e.g. `9999.42` with step=10) survives a blur. `naturalDigits`
    // strips trailing zeros, so step-aligned values still render clean.
    const displayDecimals = useMemo(() => {
      if (typeof maxDecimals === 'number') {
        return Math.max(decimals, Math.max(0, Math.floor(maxDecimals)))
      }
      return Math.max(decimals, 8)
    }, [decimals, maxDecimals])

    // Skia's `font.measureText` is synchronous on JS thread — single
    // probe at max size, scale linearly to compute widths at smaller
    // sizes. (`useFont` returns null until loaded.)
    const probeFont = useFont(
      require('../../assets/fonts/Aeonik-Medium.otf'),
      INITIAL_FONT_SIZE
    )
    const [fontSize, setFontSize] = useState(INITIAL_FONT_SIZE)
    const fontSizeSv = useSharedValue(INITIAL_FONT_SIZE)
    useEffect(() => {
      fontSizeSv.value = withTiming(fontSize, { duration: 20 })
    }, [fontSize, fontSizeSv])

    const currentText = useMemo(() => {
      if (draft !== null) return draft
      const clamped = value < 0 ? 0 : value > max ? max : value
      return naturalDigits(clamped, displayDecimals)
    }, [draft, value, max, displayDecimals])

    // Re-measure only when text length changes — most drag updates
    // don't, and skipping the measurement avoids per-frame wobble.
    const lastMeasuredLengthRef = useRef(0)

    useEffect(() => {
      if (!probeFont || currentText.length === 0) return
      if (currentText.length === lastMeasuredLengthRef.current) return
      lastMeasuredLengthRef.current = currentText.length
      const w = probeFont.measureText(currentText).width
      if (w === 0) return
      const usable = AMOUNT_FIT_WIDTH - AMOUNT_WIDTH_PADDING
      const ratio = Math.min(1, usable / w)
      const target = Math.floor(INITIAL_FONT_SIZE * ratio)
      const clamped = Math.max(
        MIN_FONT_SIZE,
        Math.min(INITIAL_FONT_SIZE, target)
      )
      setFontSize(prev => (prev === clamped ? prev : clamped))
    }, [currentText, probeFont])

    const startEdit = useCallback(() => {
      if (!enableManualInput) return
      if (draft !== null) return
      // Defensive reset: a stale `isActive=true` (from an interrupted
      // gesture or preset animation) would have `editingAnimatedProps`
      // overwrite the typed text with the step-snapped value.
      isActive.value = false
      const initial = naturalDigits(clamp(value, 0, max), displayDecimals)
      setDraft(initial)
      // Focus is driven from a state-bound effect (below), not here:
      // `.focus()` before React commits `editable=true` silently fails
      // on Android ("two taps to open keyboard") and can cross-focus
      // siblings.
    }, [enableManualInput, draft, value, max, displayDecimals, isActive])

    // Double-rAF defers `.focus()` past the native `editable=true`
    // commit on Android — calling earlier silently fails there.
    useEffect(() => {
      if (!isEditing) return
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
        cancelIds.id2 = id2
      })
      const cancelIds: { id2?: number } = { id2: undefined }
      return () => {
        cancelAnimationFrame(id1)
        if (cancelIds.id2 !== undefined) cancelAnimationFrame(cancelIds.id2)
      }
    }, [isEditing])

    const handleChangeText = useCallback(
      (text: string) => {
        // Normalise `,` → `.` for de-DE / fr-FR keyboards.
        let next = sanitizeDecimalInput(text.replace(/,/g, '.'), max)
        if (typeof maxDecimals === 'number' && maxDecimals >= 0) {
          const dotIdx = next.indexOf('.')
          if (dotIdx !== -1) {
            next =
              maxDecimals === 0
                ? next.slice(0, dotIdx)
                : next.slice(0, dotIdx + 1 + maxDecimals)
          }
        }
        setDraft(next)
      },
      [max, maxDecimals]
    )

    const handleBlur = useCallback(() => {
      if (draft !== null) {
        const committed = commitDraftText(draft, max)
        if (committed !== null) {
          progressSv.value = valueToProgress(committed, max)
          onChange(committed)
          onCommit(committed)
        }
      }
      setDraft(null)
    }, [draft, progressSv, onChange, onCommit, max])

    // While editing, keep the React draft in sync with the underlying
    // `value` — covers swipe-while-editing: the gesture's `onChange`
    // updates `value`, which then rolls into the displayed draft so the
    // input shows the new value once the drag-time animatedProps stops
    // writing to native text.
    useEffect(() => {
      if (!isEditing) return
      setDraft(naturalDigits(clamp(value, 0, max), displayDecimals))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    // UI-thread text driver during drag / preset animation, bypassing
    // JS-thread lag. `startEdit` and `handleBlur` reset `isActive` so a
    // stale flag can't overwrite a freshly-typed draft.
    const editingAnimatedProps = useAnimatedProps(() => {
      if (!isActive.value) {
        return {} as { text?: string; defaultValue?: string }
      }
      const raw = progressSv.value * max
      const clamped = raw < 0 ? 0 : raw > max ? max : raw
      const stepIdx = Math.round(clamped / step)
      const snapped = stepIdx * step
      const textValue =
        decimals > 0 ? snapped.toFixed(decimals) : `${Math.round(snapped)}`
      return { text: textValue, defaultValue: textValue }
    })

    // Danger flip lives off the typed `draftValue` while editing so the
    // colour updates per keystroke instead of waiting for blur/commit.
    const draftValue = useMemo(() => {
      if (draft === null || draft === '' || draft === '.') return null
      const parsed = Number(draft)
      return Number.isFinite(parsed) ? parsed : null
    }, [draft])
    const hasReference =
      referenceValue !== undefined &&
      referenceValue >= 0 &&
      referenceValue <= max
    const inputBelowRef =
      hasReference && (draftValue ?? value) < (referenceValue as number)
    const inputColor = inputBelowRef ? colors.$textDanger : colors.$textPrimary

    const inputBottom =
      caption !== undefined
        ? INPUT_BOTTOM_WITH_CAPTION
        : INPUT_BOTTOM_NO_CAPTION
    const labelBottom =
      inputBottom + INITIAL_FONT_SIZE + (caption !== undefined ? 4 : 12)

    const amountStyle = {
      fontFamily: 'Aeonik-Medium',
      color: inputColor
    } as const

    const animatedDigitStyle = useAnimatedStyle(() => ({
      fontSize: fontSizeSv.value,
      lineHeight: fontSizeSv.value
    }))

    useImperativeHandle(ref, () => ({ startEdit }), [startEdit])

    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        // `box-none` keeps idle taps falling through to the dial gesture
        // (the input wrapper switches its own pointerEvents to `none`)
        // while letting the TextInput catch touches when editing.
        pointerEvents="box-none">
        {label !== undefined && (
          <Text
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: labelBottom,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: 'Aeonik-Medium',
              fontSize: 24,
              lineHeight: 24,
              color: inputColor
            }}>
            {label}
          </Text>
        )}
        <View
          style={{
            position: 'absolute',
            bottom: inputBottom,
            left: 0,
            right: 0,
            height: INITIAL_FONT_SIZE,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          pointerEvents={isEditing ? 'box-none' : 'none'}>
          <AnimatedTextInput
            ref={inputRef}
            value={currentText}
            placeholder={placeholder ?? '0'}
            placeholderTextColor={alpha(colors.$textPrimary, 0.3)}
            animatedProps={editingAnimatedProps}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            keyboardType="decimal-pad"
            allowFontScaling={false}
            // Idle inputs stay out of Android's focus chain — otherwise
            // tapping one dial can cross-focus a sibling's TextInput.
            editable={isEditing}
            style={[
              amountStyle,
              animatedDigitStyle,
              {
                width: AMOUNT_CANVAS_WIDTH,
                textAlign: 'center',
                padding: 0,
                paddingHorizontal: 12,
                margin: 0
              }
            ]}
            testID={`${testIDPrefix}-value-input`}
          />
        </View>
        {caption !== undefined && (
          <Text
            pointerEvents="none"
            numberOfLines={1}
            style={{
              position: 'absolute',
              bottom: CAPTION_BOTTOM,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: 'Inter-Regular',
              fontSize: CAPTION_FONT_SIZE,
              lineHeight: CAPTION_LINE_HEIGHT,
              color: inputColor
            }}>
            {caption}
          </Text>
        )}
      </View>
    )
  }
)

DialReadout.displayName = 'DialReadout'
