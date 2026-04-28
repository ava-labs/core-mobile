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

// Font-size auto-fit configuration (ported from AutoSizeTextInput, but
// using Skia's synchronous `font.measureText` instead of a hidden RN
// <Text> that round-trips through RN layout).
const INITIAL_FONT_SIZE = 50
const MIN_FONT_SIZE = 14
// Canvas width — spans the arc's bottom-left to bottom-right endpoints
// (≈ arc diameter, 2 × 110). Wide enough that mid-animation glyphs
// don't get clipped against the canvas edge.
const AMOUNT_CANVAS_WIDTH = 220
// Inset from each canvas edge for fit calculations — text shrinks to
// fit within this narrower area so it doesn't touch the arc visually.
const AMOUNT_FIT_INSET = 20
// Effective horizontal space text is sized against.
const AMOUNT_FIT_WIDTH = AMOUNT_CANVAS_WIDTH - 2 * AMOUNT_FIT_INSET // 180
// Reserve a small amount so stroke caps / subpixel rounding don't clip.
const AMOUNT_WIDTH_PADDING = 4

// Pixel offsets from the bottom of the readout area. Both label and
// input are pinned independently so the label doesn't move when the
// input shrinks/grows during auto-fit. Two layouts:
//
//  - **No caption** (default): input bottom sits ~3px below the arc
//    bottom, matching the previous design.
//  - **With caption** (e.g. `"$177.31 USD"`): the caption pins to the
//    bottom; input + label shift up by `caption lineHeight + gap` so
//    the whole stack stays inside the dial card.
const INPUT_BOTTOM_NO_CAPTION = 39
// Caption typography from Figma: Inter Regular 13 / lineHeight 16.
const CAPTION_FONT_SIZE = 13
const CAPTION_LINE_HEIGHT = 16
const CAPTION_BOTTOM = 22
// Visual gap between the input's bottom edge and the caption's top edge.
const CAPTION_INPUT_GAP = 10
const INPUT_BOTTOM_WITH_CAPTION = CAPTION_LINE_HEIGHT + CAPTION_BOTTOM + 4

// Natural (non-padded) decimal form. Used for the idle display and the
// initial editing draft so the user sees `"5"` instead of `"5.00"` when
// no fractional part is meaningful. The drag-time animated text still
// uses `toFixed(decimals)` so sliders snap visibly at step granularity.
const naturalDigits = (v: number, decimals: number): string => {
  if (decimals <= 0) return `${Math.round(v)}`
  return v.toFixed(decimals).replace(/\.?0+$/, '')
}

export type DialReadoutHandle = {
  /** Open the TextInput for manua l editing. No-op when `enableManualInput` is false. */
  startEdit: () => void
  /**
   * Close the TextInput without committing the draft. Used when a pan
   * gesture begins while the user is still editing — the drag takes
   * over the value, so the typed draft is discarded.
   */
  cancelEdit: () => void
}

type DialReadoutProps = {
  value: number
  min: number
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
}

/**
 * Center-of-dial label + amount readout. When `enableManualInput` is true
 * and the user taps the amount, it swaps in a `TextInput` overlaid at the
 * same position so the value can be typed. The TextInput also reflects
 * the wheel position live via `useAnimatedProps` while the dial is in
 * motion, so fast-finger drags don't lag behind the display.
 */
export const DialReadout = forwardRef<DialReadoutHandle, DialReadoutProps>(
  (
    {
      value,
      min,
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
      onCommit
    },
    ref
  ) => {
  const {
    theme: { colors }
  } = useTheme()

  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)
  // When true, the next `handleBlur` skips committing — used when a pan
  // gesture cancels the editing session so the typed draft is discarded.
  const suppressCommitRef = useRef(false)
  const isEditing = draft !== null
  // UI-thread mirror of `isEditing` — read inside `editingAnimatedProps`
  // so the worklet can bail out and stop overwriting the user's typed
  // text with the step-snapped value while editing.
  const isEditingSv = useSharedValue(false)
  useEffect(() => {
    isEditingSv.value = isEditing
  }, [isEditing, isEditingSv])

  // Decimals the idle / editing display is allowed to show. `decimals`
  // (derived from `step`) governs the drag-time animatedProps so the
  // dial visibly snaps at step granularity. For idle and editing we
  // widen so a value typed beyond step precision (e.g. `9999.42` with
  // step=10) survives a blur — without it, `naturalDigits(v, 0)` would
  // round to `"9999"`. `naturalDigits` strips trailing zeros, so step-
  // aligned values still display naturally even at the wider precision.
  const displayDecimals = useMemo(() => {
    if (typeof maxDecimals === 'number') {
      return Math.max(decimals, Math.max(0, Math.floor(maxDecimals)))
    }
    // No explicit cap → pick a generous default so arbitrary typed
    // precision (e.g. 2.32 with step=10) renders intact.
    return Math.max(decimals, 8)
  }, [decimals, maxDecimals])

  // Probe font at the maximum size — used only to measure the current
  // text's width via Skia's synchronous `font.measureText`. Width at any
  // smaller target size scales linearly with font size, so one probe is
  // enough for auto-fit.
  const probeFont = useFont(
    require('../../assets/fonts/Aeonik-Medium.otf'),
    INITIAL_FONT_SIZE
  )
  const [fontSize, setFontSize] = useState(INITIAL_FONT_SIZE)
  // Animated mirror of fontSize. Driving the visible font size through a
  // shared value (instead of plain state) keeps the prefix Text, the
  // TextInput, and the suffix Text resizing in lockstep on the UI thread —
  // otherwise each child re-layouts on its own paint cycle and the prefix
  // visibly drifts away from the digits during auto-fit transitions.
  const fontSizeSv = useSharedValue(INITIAL_FONT_SIZE)
  useEffect(() => {
    fontSizeSv.value = withTiming(fontSize, { duration: 80 })
  }, [fontSize, fontSizeSv])

  // Text currently on screen — used to drive auto-fit fontSize. Mirrors
  // `idleDigits` (no step-snap) so the measured string matches what the
  // input actually renders.
  const currentText = useMemo(() => {
    if (draft !== null) return draft
    const clamped = value < min ? min : value > max ? max : value
    return naturalDigits(clamped, displayDecimals)
  }, [draft, value, min, max, displayDecimals])

  // Cache the last *character count* that triggered a measurement. Skia
  // digit widths are close enough that re-measuring same-length text is
  // unnecessary — and skipping it avoids per-frame wobble during drag
  // (every 1% step crossing updates `value` but most don't change length).
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
    // Force `isActive` off so `editingAnimatedProps` stops writing the
    // step-snapped value into the native input on the UI thread. Without
    // this, a stale `isActive=true` (e.g. from an interrupted gesture or
    // preset-press animation) overwrites the user's typed text with the
    // snapped value (e.g. typing `9999.42` with step=10 would visibly
    // reset to `10000`).
    isActive.value = false
    // Seed the draft with the current value (clamped, not step-snapped)
    // so manually-typed precision is preserved when the user re-enters
    // editing.
    const initial = naturalDigits(clamp(value, min, max), displayDecimals)
    setDraft(initial)
    // No imperative focus here — see the useEffect below. Calling
    // `.focus()` synchronously runs before React commits `editable=true`
    // and on Android can cross-focus another TextInput in the focus
    // chain. Driving focus from a state-bound effect avoids both.
  }, [enableManualInput, draft, value, min, max, displayDecimals, isActive])

  // Focus the TextInput once `isEditing` flips true. The double-rAF
  // defers `.focus()` past the next paint so the native `editable=true`
  // prop has fully committed on Android — calling `.focus()` on a
  // not-yet-editable EditText silently fails there, which manifested as
  // "two taps needed to open keyboard".
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

  const handleFocus = useCallback(() => {
    // If `startEdit` already initialised the draft, skip — otherwise we
    // re-set the same state and trigger a redundant re-render that
    // visibly flashes the dial when the keyboard opens.
    if (draft !== null) return
    // Same isActive reset as in `startEdit` — see comment there.
    isActive.value = false
    const next = naturalDigits(clamp(value, min, max), displayDecimals)
    setDraft(next)
  }, [draft, value, min, max, displayDecimals, isActive])

  const handleChangeText = useCallback(
    (text: string) => {
      // Normalise `,` → `.` so locales whose decimal-pad shows `,`
      // (e.g. de-DE, fr-FR) parse correctly.
      let next = sanitizeDecimalInput(text.replace(/,/g, '.'), max)
      // Cap typed decimal places when `maxDecimals` is provided.
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
      if (next === '' || next === '.') return
      const parsed = Number(next)
      if (!Number.isFinite(parsed)) return
      const target = clamp(parsed, min, max)
      progressSv.value = withTiming(valueToProgress(target, min, max), {
        duration: 200
      })
    },
    [progressSv, min, max, maxDecimals]
  )

  const handleBlur = useCallback(() => {
    if (suppressCommitRef.current) {
      suppressCommitRef.current = false
      setDraft(null)
      return
    }
    if (draft !== null) {
      const committed = commitDraftText(draft, { min, max, step })
      if (committed !== null) {
        progressSv.value = valueToProgress(committed, min, max)
        onChange(committed)
        onCommit(committed)
      }
    }
    setDraft(null)
  }, [draft, progressSv, onChange, onCommit, min, max, step])

  const cancelEdit = useCallback(() => {
    if (draft === null) return
    suppressCommitRef.current = true
    setDraft(null)
    inputRef.current?.blur()
  }, [draft])

  // Static digit string the TextInput shows when neither editing nor
  // dragging. Renders the actual value (clamped to [min,max]) without
  // snapping to step — so a manually-typed `9999.42` displays as
  // `"9999.42"` even when step=10. Slides still produce step-snapped
  // values via the gesture's `onEnd`, so they look clean by themselves.
  const idleDigits = useMemo(() => {
    const clamped = value < min ? min : value > max ? max : value
    return naturalDigits(clamped, displayDecimals)
  }, [value, min, max, displayDecimals])

  // Drives the TextInput on the UI thread during an active dial motion,
  // so the visible value tracks the knob without JS-thread lag. Bails
  // out while the user is editing — otherwise a stale `isActive=true`
  // (e.g. from an interrupted pan that never fired `onEnd`) would
  // continuously overwrite the typed digits with the step-snapped value
  // (e.g. typing `9999.42` with step=10 visibly resets to `10000`).
  const editingAnimatedProps = useAnimatedProps(() => {
    if (isEditingSv.value || !isActive.value) {
      return {} as { text?: string; defaultValue?: string }
    }
    const raw = min + progressSv.value * (max - min)
    const clamped = raw < min ? min : raw > max ? max : raw
    const stepIdx = Math.round((clamped - min) / step)
    const snapped = min + stepIdx * step
    const textValue =
      decimals > 0 ? snapped.toFixed(decimals) : `${Math.round(snapped)}`
    return { text: textValue, defaultValue: textValue }
  })

  // Values below the reference tick are treated as invalid — the amount
  // flips to the danger colour in that state. We factor in the typed
  // draft so colour updates live per keystroke before blur/commit.
  const tickProgress =
    referenceValue !== undefined &&
    referenceValue >= min &&
    referenceValue <= max
      ? valueToProgress(referenceValue, min, max)
      : null
  const hasReference = tickProgress !== null

  const draftValue = useMemo(() => {
    if (draft === null || draft === '' || draft === '.') return null
    const parsed = Number(draft)
    return Number.isFinite(parsed) ? parsed : null
  }, [draft])
  const inputBelowRef =
    hasReference && (draftValue ?? value) < (referenceValue as number)
  const inputColor = inputBelowRef ? colors.$textDanger : colors.$textPrimary

  // Pick the bottom-pin offsets based on whether a caption is rendered.
  // Caption sits at `CAPTION_BOTTOM`; the input clears it by
  // `CAPTION_LINE_HEIGHT + CAPTION_INPUT_GAP`; label clears the input
  // by `INITIAL_FONT_SIZE + 4`.
  const inputBottom =
    caption !== undefined ? INPUT_BOTTOM_WITH_CAPTION : INPUT_BOTTOM_NO_CAPTION
  const labelBottom = inputBottom + INITIAL_FONT_SIZE + 4

  const amountStyle = {
    fontFamily: 'Aeonik-Medium',
    color: inputColor
  } as const

  // Animated fontSize / lineHeight driven by `fontSizeSv` so the
  // TextInput resizes smoothly as the auto-fit picks new sizes.
  const animatedDigitStyle = useAnimatedStyle(() => ({
    fontSize: fontSizeSv.value,
    lineHeight: fontSizeSv.value
  }))

  useImperativeHandle(ref, () => ({ startEdit, cancelEdit }), [
    startEdit,
    cancelEdit
  ])

  return (
    // Fill the parent (DialArc area) so the label and input can each be
    // pinned to its own absolute bottom. Independently anchoring them
    // means the label doesn't shift up/down when the input's auto-fit
    // changes its height.
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      // `box-none` lets children (the TextInput) catch touches when
      // editing, while the amount display below has pointerEvents="none"
      // on its Canvas — so drags on the amount pass through to the dial's
      // pan gesture and taps are handled by the parent's Gesture.Tap.
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
            // Mirror the input's danger flip so the label flags the
            // invalid state (value below the reference tick) too.
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
          value={draft ?? idleDigits}
          placeholder={placeholder}
          placeholderTextColor={alpha(colors.$textPrimary, 0.3)}
          animatedProps={editingAnimatedProps}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleBlur}
          keyboardType="decimal-pad"
          allowFontScaling={false}
          // Only editable while actively editing. Keeps the input out
          // of Android's focus chain when idle, otherwise tapping one
          // dial could route focus to a sibling dial's TextInput.
          editable={isEditing}
          style={[
            amountStyle,
            animatedDigitStyle,
            {
              width: AMOUNT_CANVAS_WIDTH,
              textAlign: 'center',
              padding: 0,
              margin: 0
            }
          ]}
          testID="circular-dial-value-input"
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
