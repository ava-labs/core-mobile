import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { AccessibilityInfo } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  FadeIn,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from '../../hooks'
import { View } from '../Primitives'
import { clamp, snapToStep, validateRange } from './helpers'
import { LeverageDisplay } from './LeverageDisplay'
import { LeverageWheel } from './LeverageWheel'
import type { LeverageGaugeProps, Preset } from './types'
import { useLeverageValue } from './useLeverageValue'

const DEFAULT_PRESETS: Preset[] = ['min', 'max']
const noop = (): void => undefined
// Hoisted so the default `formatValue` has a stable reference across
// renders — otherwise the LeverageDisplay memo bailout breaks whenever
// the consumer doesn't pass their own formatValue.
const DEFAULT_FORMAT_VALUE = (v: number): string => `${v}×`

export const LeverageGauge: FC<LeverageGaugeProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  presets = DEFAULT_PRESETS,
  enableManualInput = false,
  formatValue = DEFAULT_FORMAT_VALUE,
  subtitle,
  decimals,
  integersOnly = false,
  onHapticTick = true,
  onCommit = noop,
  velocityPower = 1,
  coastDeceleration = 0.9991,
  testID
}) => {
  const { theme } = useTheme()
  // Stabilize `onChange` / `onCommit` behind refs so downstream memoized
  // components (LeverageWheel / LeverageDisplay) can bail out of re-renders
  // even when the consumer passes fresh callbacks every parent render. The
  // refs themselves are stable; the actual functions inside them are
  // refreshed in an effect so closures remain up-to-date.
  const onChangeRef = useRef(onChange)
  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])
  const stableOnChange = useCallback((v: number) => onChangeRef.current(v), [])
  const stableOnCommit = useCallback((v: number) => onCommitRef.current(v), [])

  // When integersOnly, force the snap step to at least 1 so the wheel
  // locks to integer positions regardless of the caller-supplied step.
  const effectiveStep = integersOnly ? Math.max(1, Math.round(step)) : step
  const {
    min: vMin,
    max: vMax,
    step: vStep,
    isValid
  } = useMemo(
    () => validateRange({ min, max, step: effectiveStep }),
    [min, max, effectiveStep]
  )

  // Decimal places to show. integersOnly forces 0; explicit prop wins next;
  // otherwise inferred from step.
  const vDecimals = useMemo(() => {
    if (integersOnly) return 0
    if (typeof decimals === 'number') return Math.max(0, Math.floor(decimals))
    return vStep < 1 ? Math.ceil(-Math.log10(vStep)) : 0
  }, [integersOnly, decimals, vStep])

  // Filter out-of-range numeric presets; warn once per change.
  const filteredPresets = useMemo(() => {
    const out: Preset[] = []
    let dropped = 0
    for (const p of presets) {
      if (p === 'min' || p === 'max') {
        out.push(p)
        continue
      }
      if (p >= vMin && p <= vMax) out.push(p)
      else dropped++
    }
    if (dropped > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[LeverageGauge] Dropped ${dropped} preset(s) outside [${vMin}, ${vMax}].`
      )
    }
    return out
  }, [presets, vMin, vMax])

  const resolvedSubtitle = subtitle ?? `Up to ${vMax}× leverage`

  const { currentValue, isActive } = useLeverageValue({
    value,
    min: vMin,
    max: vMax,
    step: vStep
  })
  // True while a preset/programmatic animation is running. isActive is also
  // true, which blocks useLeverageValue's sync effect — but we use this
  // separate flag so LeverageWheel can suppress haptics for programmatic
  // moves (would otherwise fire for every step boundary crossed in 400ms).
  const isProgrammatic = useSharedValue(false)

  const handlePresetPress = useCallback(
    (v: number) => {
      const snapped = snapToStep(clamp(v, vMin, vMax), vMin, vStep)
      isActive.value = true
      isProgrammatic.value = true
      currentValue.value = withTiming(
        snapped,
        { duration: 900, easing: Easing.out(Easing.cubic) },
        finished => {
          isActive.value = false
          isProgrammatic.value = false
          if (finished) {
            scheduleOnRN(stableOnChange, snapped)
            scheduleOnRN(stableOnCommit, snapped)
          }
        }
      )
    },
    [
      currentValue,
      isActive,
      isProgrammatic,
      stableOnChange,
      stableOnCommit,
      vMin,
      vMax,
      vStep
    ]
  )

  const handleManualCommit = useCallback(
    (v: number) => {
      const snapped = snapToStep(clamp(v, vMin, vMax), vMin, vStep)
      currentValue.value = snapped
      stableOnChange(snapped)
      stableOnCommit(snapped)
    },
    [currentValue, stableOnChange, stableOnCommit, vMin, vMax, vStep]
  )

  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      const action = event.nativeEvent.actionName
      if (action !== 'increment' && action !== 'decrement') return
      const delta = action === 'increment' ? vStep : -vStep
      const next = snapToStep(clamp(value + delta, vMin, vMax), vMin, vStep)
      stableOnChange(next)
      stableOnCommit(next)
      AccessibilityInfo.announceForAccessibility(formatValue(next))
    },
    [value, vMin, vMax, vStep, stableOnChange, stableOnCommit, formatValue]
  )

  if (!isValid) {
    // Minimal disabled render — caller is misconfigured.
    return (
      <View style={{ alignSelf: 'stretch' }} testID={testID}>
        <LeverageDisplay
          value={clamp(value, Math.min(min, max), Math.max(min, max))}
          currentValue={currentValue}
          isActive={isActive}
          min={Math.min(min, max)}
          max={Math.max(min, max)}
          step={vStep}
          decimals={vDecimals}
          integersOnly={integersOnly}
          presets={filteredPresets}
          subtitle={resolvedSubtitle}
          formatValue={formatValue}
          enableManualInput={false}
          onPresetPress={noop}
          onManualCommit={noop}
        />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flexShrink: 1 }}>
      <Animated.View
        // Fades the gauge in on mount to mask Skia's cold-start blank frame.
        // SkiaPreload at the app root warms the typeface + glyph atlases
        // ahead of time, so this only needs to cover the per-Canvas native
        // bringup — a short delay plus fade is enough.
        entering={FadeIn.delay(400).duration(300)}
        style={{ alignSelf: 'stretch', gap: 4 }}
        testID={testID}
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{
          min: Math.round(vMin),
          max: Math.round(vMax),
          now: Math.round(value),
          text: formatValue(value)
        }}
        onAccessibilityAction={handleAccessibilityAction}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}>
        <View
          style={{
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            paddingVertical: 16,
            paddingHorizontal: 40,
            height: 150,
            backgroundColor: theme.colors.$surfaceSecondary
          }}>
          <LeverageDisplay
            value={value}
            currentValue={currentValue}
            isActive={isActive}
            min={vMin}
            max={vMax}
            step={vStep}
            decimals={vDecimals}
            integersOnly={integersOnly}
            presets={filteredPresets}
            subtitle={resolvedSubtitle}
            formatValue={formatValue}
            enableManualInput={enableManualInput}
            onPresetPress={handlePresetPress}
            onManualCommit={handleManualCommit}
          />
        </View>
        <View
          style={{
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            backgroundColor: theme.colors.$surfaceSecondary,
            height: 110,
            justifyContent: 'center',
            paddingHorizontal: 36
          }}>
          <LeverageWheel
            currentValue={currentValue}
            isActive={isActive}
            isProgrammatic={isProgrammatic}
            min={vMin}
            max={vMax}
            step={vStep}
            integersOnly={integersOnly}
            onChange={stableOnChange}
            onCommit={stableOnCommit}
            onHapticTick={onHapticTick}
            velocityPower={velocityPower}
            coastDeceleration={coastDeceleration}
          />
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  )
}
