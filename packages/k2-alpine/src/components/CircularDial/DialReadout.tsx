import { useFont } from '@shopify/react-native-skia'
import { SxProp } from 'dripsy'
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
  cancelAnimation,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { alpha, clamp } from '../../utils'
import { Text, View } from '../Primitives'
import {
  commitDraftText,
  formatNatural,
  sanitizeDecimalInput,
  snapToStep,
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

// Per-keystroke arc easing. Each new withTiming cancels the prior,
// so fast typing chases the latest value smoothly.
const TYPING_ANIM_MS = 80

// Fallback cap on display decimals when caller doesn't pass `maxDecimals`.
// Wider than step-derived `decimals` so typed precision survives a blur.
const DEFAULT_MAX_DISPLAY_DECIMALS = 8

// Strips trailing zeros so `5` stays `"5"` and `5.5` stays `"5.5"`.
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
  /** Step the live (drag) display snaps to, matching committed values. */
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
  /** Style for the label */
  labelSx?: SxProp
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
      labelSx,
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

    // UI-thread mirror of editing state so the display worklet can step aside
    // and let the controlled draft own the text while the user types. Set
    // synchronously at the enter/exit points (startEdit / handleBlur) rather
    // than via an effect — an effect trails `isEditing` by a frame, briefly
    // letting both the controlled value and the animated text drive the input
    // at the boundary.
    const isEditingSv = useSharedValue(false)

    // Wider than step-derived `decimals` so typed precision beyond step
    // (e.g. `9999.42` with step=10) survives a blur. `naturalDigits`
    // strips trailing zeros, so step-aligned values still render clean.
    const displayDecimals = useMemo(() => {
      if (typeof maxDecimals === 'number') {
        return Math.max(decimals, Math.max(0, Math.floor(maxDecimals)))
      }
      return Math.max(decimals, DEFAULT_MAX_DISPLAY_DECIMALS)
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

    // Drive the visible number from progressSv on the UI thread whenever the
    // dial isn't being manually edited. This decouples the readout from the
    // parent's controlled `value` round-trip, so a fast swipe-and-release
    // lands on the final value instantly instead of lagging behind it or
    // drifting as queued onChange echoes drain on the JS thread. While
    // editing, return {} so the controlled draft owns the text.
    const displayAnimatedProps = useAnimatedProps(() => {
      if (isEditingSv.value) {
        return {} as { text?: string; defaultValue?: string }
      }
      const raw = progressSv.value * max
      // Snap to step only mid-drag so the live value ticks in clean step
      // increments; idle / committed / manually-typed values are shown
      // exactly (progressSv already holds the precise committed value).
      const shown = isActive.value ? snapToStep(raw, step, max) : raw
      const text = formatNatural(shown, displayDecimals)
      return { text, defaultValue: text }
    })

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
      isActive.value = false
      // Cancel any in-flight preset animation so its completion
      // doesn't fire `onChange(target)` after the user has started
      // typing and clobber the draft.
      cancelAnimation(progressSv)
      const initial = naturalDigits(clamp(value, 0, max), displayDecimals)
      isEditingSv.value = true
      setDraft(initial)
    }, [
      enableManualInput,
      draft,
      value,
      max,
      displayDecimals,
      isActive,
      isEditingSv,
      progressSv
    ])

    // Double-rAF defers `.focus()` past the native `editable=true`
    // commit — calling earlier silently fails on Android.
    useEffect(() => {
      if (!isEditing) return
      const cancelIds: { id2?: number } = { id2: undefined }
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
        cancelIds.id2 = id2
      })
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
        // Animate to the typed value; each new withTiming cancels
        // the prior so fast typing chases smoothly.
        const target =
          next === '' || next === '.'
            ? 0
            : Number.isFinite(Number(next))
            ? valueToProgress(Number(next), max)
            : null
        if (target !== null) {
          progressSv.value = withTiming(target, {
            duration: TYPING_ANIM_MS
          })
        }
        // Emit `onChange` live while typing (mirrors the drag behaviour)
        // so consumers can react to the value as it's entered — not only
        // on commit (blur/submit). `onCommit` still fires only on commit.
        const live = next === '' || next === '.' ? 0 : Number(next)
        if (Number.isFinite(live)) {
          onChange(live)
        }
      },
      [max, maxDecimals, progressSv, onChange]
    )

    // Backstop that mirrors any non-typing draft change onto the
    // arc. Skips while `isActive` is true so the dial-driven
    // withTiming doesn't get cancelled.
    useEffect(() => {
      if (draft === null) return
      if (isActive.value) return
      const target =
        draft === '' || draft === '.'
          ? 0
          : Number.isFinite(Number(draft))
          ? valueToProgress(Number(draft), max)
          : null
      if (target !== null) {
        progressSv.value = withTiming(target, { duration: TYPING_ANIM_MS })
      }
    }, [draft, max, progressSv, isActive])

    const handleBlur = useCallback(() => {
      if (draft !== null) {
        // Commit the draft (empty → 0 via commitDraftText) rather than
        // reverting to `value`, so a cleared field can reach 0 (CP-14578).
        const committed = commitDraftText(draft, max)
        progressSv.value = valueToProgress(committed, max)
        onChange(committed)
        onCommit(committed)
      }
      isEditingSv.value = false
      setDraft(null)
    }, [draft, progressSv, onChange, onCommit, max, isEditingSv])

    // While editing, roll external `value` changes into the draft
    // (covers drag/preset-while-editing). Skip when the draft
    // already matches `value` numerically — avoids clobbering an
    // in-progress digit with the same number formatted differently.
    useEffect(() => {
      if (!isEditing) return
      if (draft === '.') return
      const draftNum = draft === '' ? 0 : Number(draft)
      if (Number.isFinite(draftNum) && draftNum === value) return
      setDraft(naturalDigits(clamp(value, 0, max), displayDecimals))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    // Use the typed draft for the danger-colour check so it flips
    // per keystroke, not on blur.
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
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: labelBottom,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 13,
              // Match the amount's invalid-state cue (danger when below the
              // reference); `labelSx` can still override.
              color: inputColor,
              ...labelSx
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
            // Controlled by the draft only while editing; otherwise left
            // uncontrolled so `displayAnimatedProps` can drive the text on
            // the UI thread without the parent's controlled `value` fighting
            // it on every re-render. `defaultValue` seeds the first paint.
            value={isEditing ? currentText : undefined}
            defaultValue={currentText}
            animatedProps={displayAnimatedProps}
            placeholder={placeholder ?? '0'}
            placeholderTextColor={alpha(colors.$textPrimary, 0.3)}
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
                // Width is intrinsic; font auto-fit shrinks the
                // digits before width hits `maxWidth`.
                maxWidth: AMOUNT_CANVAS_WIDTH,
                textAlign: 'center',
                padding: 0,
                paddingHorizontal: 8,
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
