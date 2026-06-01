import React, { useCallback, useMemo, useState } from 'react'
import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'
import { useRecurringSwapContext } from '../contexts/RecurringSwapContext'
import { useRecurringEligibility } from '../hooks/useRecurringEligibility'
import { FREQUENCY_UNITS, type Frequency, type FrequencyUnit } from '../types'
import { DrumColumn } from '../components/DrumColumn'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum value per unit (inclusive). */
const MAX_VALUE: Record<FrequencyUnit, number> = {
  minute: 60,
  hour: 24,
  day: 30,
  week: 12,
  month: 12
}

/** Approximate seconds per unit. Used only for floor validation. */
const UNIT_TO_SECONDS: Record<FrequencyUnit, number> = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2592000
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pluralise(unit: FrequencyUnit, value: number): string {
  return value === 1 ? unit : `${unit}s`
}

function buildValueItems(unit: FrequencyUnit): string[] {
  return Array.from({ length: MAX_VALUE[unit] }, (_, i) => String(i + 1))
}

function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    const n = Math.ceil(seconds / 60)
    return `${n} ${n === 1 ? 'minute' : 'minutes'}`
  }
  const n = Math.ceil(seconds / 3600)
  return `${n} ${n === 1 ? 'hour' : 'hours'}`
}

// ─── FrequencyPickerScreen ────────────────────────────────────────────────────

export function FrequencyPickerScreen(): JSX.Element {
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const { frequency, setFrequency } = useRecurringSwapContext()
  const { fromToken, toToken } = useSwapContext()
  const activeAccount = useSelector(selectActiveAccount)
  const evmAddress = activeAccount?.addressC

  const eligibility = useRecurringEligibility(fromToken, toToken, evmAddress)
  const minIntervalSeconds = eligibility.eligible
    ? eligibility.minIntervalSeconds
    : 300

  // ── Local state ──────────────────────────────────────────────────────────

  const [unit, setUnit] = useState<FrequencyUnit>(frequency?.unit ?? 'week')
  const [value, setValue] = useState<number>(frequency?.value ?? 1)

  // ── Derived values ───────────────────────────────────────────────────────

  const cap = MAX_VALUE[unit]
  // Clamp value into [1, cap] whenever the unit changes.
  const safeValue = Math.min(value, cap)

  const valueItems = useMemo(() => buildValueItems(unit), [unit])
  const unitItems = useMemo(
    () => FREQUENCY_UNITS.map(u => pluralise(u, safeValue)),
    // Re-derive labels when value changes (plural form depends on value).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeValue]
  )

  const selectedValueIndex = safeValue - 1 // items are ['1','2',…]
  const selectedUnitIndex = FREQUENCY_UNITS.indexOf(unit)

  const intervalSeconds = safeValue * UNIT_TO_SECONDS[unit]
  const isBelowFloor = intervalSeconds < minIntervalSeconds

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleValueChange = useCallback(
    (index: number) => {
      setValue(index + 1)
    },
    []
  )

  const handleUnitChange = useCallback(
    (index: number) => {
      const newUnit = FREQUENCY_UNITS[index]
      if (!newUnit) return
      setUnit(newUnit)
      // Clamp value if the new unit has a smaller cap.
      const newCap = MAX_VALUE[newUnit]
      if (value > newCap) {
        setValue(newCap)
      }
    },
    [value]
  )

  const handleConfirm = useCallback(() => {
    const confirmed: Frequency = { unit, value: safeValue }
    setFrequency(confirmed)
    router.back()
  }, [unit, safeValue, setFrequency, router])

  const renderFooter = useCallback(
    () => (
      <View sx={{ gap: 8 }}>
        {isBelowFloor && (
          <Text
            variant="caption"
            sx={{ color: '$textDanger', textAlign: 'center' }}>
            Minimum interval is {formatDuration(minIntervalSeconds)}
          </Text>
        )}
        <Button
          type="primary"
          size="large"
          disabled={isBelowFloor}
          onPress={handleConfirm}>
          Confirm
        </Button>
      </View>
    ),
    [isBelowFloor, minIntervalSeconds, handleConfirm]
  )

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollScreen
      title="Frequency"
      navigationTitle="Frequency"
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ marginTop: 24 }}>
        {/* Drum pickers */}
        <View
          sx={{
            flexDirection: 'row',
            gap: 8,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.$surfacePrimary
          }}>
          <DrumColumn
            items={valueItems}
            selectedIndex={selectedValueIndex}
            onIndexChange={handleValueChange}
          />
          <DrumColumn
            items={unitItems}
            selectedIndex={selectedUnitIndex}
            onIndexChange={handleUnitChange}
          />
        </View>
      </View>
    </ScrollScreen>
  )
}

