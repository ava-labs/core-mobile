import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from '../../hooks'
import { clamp } from '../../utils'
import { View } from '../Primitives'
import {
  filterValidPresets,
  getStepDecimals,
  snapToStep,
  validateRange
} from './helpers'
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
  hapticsEnabled = true,
  onCommit = noop,
  velocityPower = 1,
  coastDeceleration = 0.9991,
  testID
}) => {
  const { theme } = useTheme()
  // Stabilize onChange/onCommit behind refs so memoized children
  // (LeverageWheel/LeverageDisplay) can bail on parent re-renders even when
  // callers pass fresh callbacks each time. Refs stay identity-stable; the
  // inner functions are refreshed via effect to keep closures up-to-date.
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

  // getStepDecimals handles non-power-of-10 steps (e.g. 0.25 → 2) correctly,
  // unlike a plain -log10(step).
  const vDecimals = useMemo(() => {
    if (integersOnly) return 0
    if (typeof decimals === 'number') return Math.max(0, Math.floor(decimals))
    return getStepDecimals(vStep)
  }, [integersOnly, decimals, vStep])

  const filteredPresets = useMemo(
    () => filterValidPresets(presets, vMin, vMax),
    [presets, vMin, vMax]
  )

  const resolvedSubtitle = subtitle ?? `Up to ${vMax}× leverage`

  const { currentValue, isActive } = useLeverageValue({
    value,
    min: vMin,
    max: vMax,
    step: vStep
  })
  // True while a preset/programmatic animation is running. Distinct from
  // isActive so LeverageWheel can suppress per-step haptics for these moves
  // (otherwise we'd fire one for every boundary the preset crosses).
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
          // If cancelled (e.g. a new gesture took over), leave the flags
          // alone — the interrupting gesture now owns them. Clearing here
          // would re-enable prop sync and haptics mid-gesture.
          if (!finished) return
          isActive.value = false
          isProgrammatic.value = false
          scheduleOnRN(stableOnChange, snapped)
          scheduleOnRN(stableOnCommit, snapped)
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

  if (!isValid) {
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
        />
      </View>
    )
  }

  return (
    <Animated.View style={{ alignSelf: 'stretch', gap: 4 }} testID={testID}>
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
      <GestureHandlerRootView style={{ flexShrink: 1 }}>
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
            hapticsEnabled={hapticsEnabled}
            velocityPower={velocityPower}
            coastDeceleration={coastDeceleration}
          />
        </View>
      </GestureHandlerRootView>
    </Animated.View>
  )
}
