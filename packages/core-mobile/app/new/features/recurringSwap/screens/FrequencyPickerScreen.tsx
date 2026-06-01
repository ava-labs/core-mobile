import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  ListRenderItemInfo
} from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'
import { useRecurringSwapContext } from '../contexts/RecurringSwapContext'
import { useRecurringEligibility } from '../hooks/useRecurringEligibility'
import { FREQUENCY_UNITS, type Frequency, type FrequencyUnit } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 48
const VISIBLE_ITEMS = 5
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS

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

// ─── DrumColumn ───────────────────────────────────────────────────────────────

interface DrumColumnProps {
  items: string[]
  selectedIndex: number
  onIndexChange: (index: number) => void
}

/**
 * A single scrollable drum-roll column.
 * Uses FlatList with snapToInterval so each gesture snaps to an item boundary.
 * The selected item is centred in the PICKER_HEIGHT window.
 */
function DrumColumn({
  items,
  selectedIndex,
  onIndexChange
}: DrumColumnProps): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const listRef = useRef<FlatList<string>>(null)

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y
      const index = Math.round(offsetY / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(index, items.length - 1))
      onIndexChange(clamped)
    },
    [items.length, onIndexChange]
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<string>) => {
      const isSelected = index === selectedIndex
      return (
        <View
          style={styles.drumItem}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            height: ITEM_HEIGHT
          }}>
          <Text
            sx={{
              fontSize: isSelected ? 20 : 16,
              fontWeight: isSelected ? '600' : '400',
              color: isSelected ? colors.$textPrimary : colors.$textSecondary,
              lineHeight: ITEM_HEIGHT
            }}>
            {item}
          </Text>
        </View>
      )
    },
    [selectedIndex, colors]
  )

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index
    }),
    []
  )

  const snapOffsets = useMemo(
    () => items.map((_, i) => i * ITEM_HEIGHT),
    [items]
  )

  // Scroll to the current selectedIndex synchronously after every layout so
  // there is no one-frame flash of misaligned content when the selection changes.
  useLayoutEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * ITEM_HEIGHT,
      animated: false
    })
  }, [selectedIndex])

  return (
    <View
      style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}
      sx={{ flex: 1 }}>
      {/* Selection highlight band */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,
          {
            top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
            backgroundColor: colors.$surfaceSecondary
          }
        ]}
      />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
          paddingBottom: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)
        }}
      />
    </View>
  )
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  drumItem: {
    height: ITEM_HEIGHT
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    zIndex: 0
  }
})
