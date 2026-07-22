import {
  Button,
  RangeSlider,
  Separator,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  addDays,
  addMonths,
  differenceInDays,
  differenceInMonths
} from 'date-fns'
import { useRouter } from 'expo-router'
import React, { FC, useCallback, useMemo, useState } from 'react'
import Animated, { Easing, LinearTransition } from 'react-native-reanimated'
import { FilterNumberInput } from '../components/FilterNumberInput'
import {
  DelegateFilterBounds,
  useDelegateFilterBounds
} from '../hooks/useDelegateFilterBounds'
import { DelegateFilters, useDelegateFilters } from '../store'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const formatPercent = (value: number): string => `${value}%`
// Number-only formatters for the inline numeric inputs (unit rendered apart).
const formatFeeValue = (value: number): string => `${value}`
const formatAvaxValue = (value: number): string => `${value}`
// Upper bound for the fee input, matching core-web's max delegation fee.
const MAX_FEE_INPUT = 100
// Mirrors core-web's `getSliderDetails`: convert the day count into calendar
// months + a day remainder (not fixed 30-day months) so e.g. 365 days reads as
// "12 months", not "12 months 5 days". Shows both non-zero parts.
const formatDuration = (days: number): string => {
  const total = Math.round(days)
  if (total <= 0) return '0 days'
  const now = new Date()
  const future = addDays(now, total)
  const months = differenceInMonths(future, now)
  const remDays = differenceInDays(future, addMonths(now, months))
  const parts: string[] = []
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)
  if (remDays > 0) parts.push(`${remDays} day${remDays === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' ') : '0 days'
}

type FilterCardProps = {
  label: string
  enabled: boolean
  onToggle: (value: boolean) => void
  children: React.ReactNode
}

/**
 * A labelled filter row with an enable toggle. When enabled, a separator and
 * the control area expand below the header. `layout` + `overflow: hidden`
 * animate the height as the body mounts/unmounts.
 */
const FilterCard: FC<FilterCardProps> = ({
  label,
  enabled,
  onToggle,
  children
}) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: colors.$surfaceSecondary
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14
        }}>
        <Text variant="body1" sx={{ fontSize: 16 }}>
          {label}
        </Text>
        <Toggle value={enabled} onValueChange={onToggle} />
      </View>
      {enabled && (
        <>
          <Separator sx={{ marginHorizontal: 16 }} />
          <View sx={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            {children}
          </View>
        </>
      )}
    </Animated.View>
  )
}

/**
 * Builds an editable draft from the user's saved filters. Toggles mirror
 * those filters verbatim — a fresh flow opens with every toggle off (the
 * web-parity baseline still filters underneath; see
 * `resolveEffectiveDelegateFilters`), and whatever the user applies is
 * exactly what they see on reopen. A user-enabled dimension replaces the
 * baseline, so e.g. enabling uptime and dragging it below 75% genuinely
 * loosens the list. Numeric values are kept inside the live bounds; a
 * disabled row keeps its last saved value (the baseline value on a fresh
 * flow, the range minimum when it has none), so flipping the toggle back on
 * starts where the user left off.
 */
const seedDraft = (
  applied: DelegateFilters,
  bounds: DelegateFilterBounds
): DelegateFilters => ({
  uptime: {
    enabled: applied.uptime.enabled,
    min: clamp(applied.uptime.min, bounds.uptime.min, bounds.uptime.max)
  },
  maxFee: {
    enabled: applied.maxFee.enabled,
    // Free numeric filter: allow any fee down to 0% (a value below the network
    // floor simply yields no matches) and retain exactly what was entered on
    // reopen — only the upper bound (100%) is enforced.
    value: clamp(applied.maxFee.value, 0, MAX_FEE_INPUT)
  },
  minAvailable: {
    enabled: applied.minAvailable.enabled,
    value:
      applied.minAvailable.value > 0
        ? Math.max(applied.minAvailable.value, bounds.minAvailable.min)
        : bounds.minAvailable.min
  },
  minTimeRemaining: {
    enabled: applied.minTimeRemaining.enabled,
    value:
      applied.minTimeRemaining.value > 0
        ? clamp(
            applied.minTimeRemaining.value,
            bounds.minTimeRemaining.min,
            bounds.minTimeRemaining.max
          )
        : bounds.minTimeRemaining.min
  }
})

const AdvancedFiltersScreen = (): JSX.Element => {
  const router = useRouter()
  const filters = useDelegateFilters(state => state.filters)
  const setFilters = useDelegateFilters(state => state.setFilters)
  const bounds = useDelegateFilterBounds()

  const [draft, setDraft] = useState<DelegateFilters>(() =>
    seedDraft(filters, bounds)
  )

  const handleApply = useCallback((): void => {
    // Saved verbatim, toggles included, so the sheet reopens exactly as
    // applied. A row toggled off falls back to the web-parity baseline for
    // that dimension (it does NOT list every node).
    setFilters(draft)
    router.back()
  }, [draft, router, setFilters])

  const handleCancel = useCallback((): void => {
    // Discard the draft — applied filters stay as they were.
    router.back()
  }, [router])

  const renderFooter = useCallback(
    () => (
      <View sx={{ gap: 12 }}>
        <Button type="primary" size="large" onPress={handleApply}>
          Apply filters
        </Button>
        <Button type="secondary" size="large" onPress={handleCancel}>
          Cancel
        </Button>
      </View>
    ),
    [handleApply, handleCancel]
  )

  const cards = useMemo(
    () => [
      <FilterCard
        key="uptime"
        label="Uptime range"
        enabled={draft.uptime.enabled}
        onToggle={value =>
          setDraft(d => ({ ...d, uptime: { ...d.uptime, enabled: value } }))
        }>
        <RangeSlider
          min={bounds.uptime.min}
          max={bounds.uptime.max}
          step={bounds.uptime.step}
          low={draft.uptime.min}
          high={bounds.uptime.max}
          lockHigh
          formatValue={formatPercent}
          onChange={low =>
            setDraft(d => ({ ...d, uptime: { ...d.uptime, min: low } }))
          }
        />
      </FilterCard>,
      <FilterCard
        key="maxFee"
        label="Max delegation fee"
        enabled={draft.maxFee.enabled}
        onToggle={value =>
          setDraft(d => ({ ...d, maxFee: { ...d.maxFee, enabled: value } }))
        }>
        <FilterNumberInput
          label="Fee"
          unit="%"
          value={draft.maxFee.value}
          min={0}
          max={MAX_FEE_INPUT}
          format={formatFeeValue}
          onChange={value =>
            setDraft(d => ({ ...d, maxFee: { ...d.maxFee, value } }))
          }
        />
      </FilterCard>,
      <FilterCard
        key="minAvailable"
        label="Min available delegation"
        enabled={draft.minAvailable.enabled}
        onToggle={value =>
          setDraft(d => ({
            ...d,
            minAvailable: { ...d.minAvailable, enabled: value }
          }))
        }>
        <FilterNumberInput
          label="Amount"
          unit="AVAX"
          value={draft.minAvailable.value}
          min={bounds.minAvailable.min}
          format={formatAvaxValue}
          onChange={value =>
            setDraft(d => ({
              ...d,
              minAvailable: { ...d.minAvailable, value }
            }))
          }
        />
      </FilterCard>,
      <FilterCard
        key="minTime"
        label="Min time remaining"
        enabled={draft.minTimeRemaining.enabled}
        onToggle={value =>
          setDraft(d => ({
            ...d,
            minTimeRemaining: { ...d.minTimeRemaining, enabled: value }
          }))
        }>
        <RangeSlider
          single
          min={bounds.minTimeRemaining.min}
          max={bounds.minTimeRemaining.max}
          step={bounds.minTimeRemaining.step}
          low={draft.minTimeRemaining.value}
          formatValue={formatDuration}
          onChange={low =>
            setDraft(d => ({
              ...d,
              minTimeRemaining: { ...d.minTimeRemaining, value: low }
            }))
          }
        />
      </FilterCard>
    ],
    [draft, bounds]
  )

  return (
    <ScrollScreen
      title="Advanced filters"
      navigationTitle="Advanced filters"
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, gap: 12 }}>
      {cards}
    </ScrollScreen>
  )
}

export default AdvancedFiltersScreen
