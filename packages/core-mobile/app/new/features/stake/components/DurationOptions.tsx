import {
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import {
  formatDurationInDays,
  getRoundedDurationInDays
} from 'features/stake/utils'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  DURATION_OPTIONS_FUJI,
  DURATION_OPTIONS_MAINNET,
  DurationOption,
  StakeDurationFormat,
  StakeDurationTitle
} from 'services/earn/getStakeEndDate'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const DurationOptions = ({
  selectedIndex,
  onSelectDuration,
  customEndDate,
  durations: durationsProp,
  maxNumberOfDays
}: {
  selectedIndex?: number
  onSelectDuration: (selectedIndex: number) => void
  customEndDate?: Date
  /**
   * Overrides the default preset list — the delegate flow passes its
   * node-aware list (1 Year swapped for Node max, see `withNodeMaxOption`).
   * Must keep the default lists' length/positions so the index-based helpers
   * below stay valid.
   */
  durations?: DurationOption[]
  /**
   * Disables day-based presets longer than this (the delegate flow passes
   * the days until the selected node's end time, so presets the node can't
   * cover read as unavailable instead of failing on Next). Custom stays
   * enabled — its picker is capped separately.
   */
  maxNumberOfDays?: number
}): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const durations = useMemo(
    () =>
      durationsProp ??
      (isDeveloperMode ? DURATION_OPTIONS_FUJI : DURATION_OPTIONS_MAINNET),
    [durationsProp, isDeveloperMode]
  )
  const rows = useMemo(() => {
    const chunks = []
    for (let i = 0; i < durations.length; i += 3) {
      chunks.push(durations.slice(i, i + 3))
    }
    return chunks
  }, [durations])

  // Anchored at NOW and rounded (not midnight + truncation) so the Custom
  // cell agrees with the Duration summary row and the confirm screen's
  // "Time to unlock". Computed once per render — only the Custom cell
  // renders it.
  const customDurationInDays = customEndDate
    ? getRoundedDurationInDays(Date.now(), customEndDate)
    : undefined

  return (
    <View sx={{ padding: 16, gap: 8 }}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          sx={{
            flexDirection: 'row',
            gap: 12,
            justifyContent: 'space-between'
          }}>
          {row.map((item, index) => {
            // Calculate the global index.
            const globalIndex = rowIndex * 3 + index
            const isSelected = globalIndex === selectedIndex
            const selectedTheme = isSelected ? inversedTheme : theme
            const isDisabled =
              maxNumberOfDays !== undefined &&
              'numberOfDays' in item &&
              item.numberOfDays > maxNumberOfDays

            return (
              <TouchableOpacity
                key={item.title}
                style={{ flex: 1, opacity: isDisabled ? 0.4 : 1 }}
                disabled={isDisabled}
                onPress={() => onSelectDuration(globalIndex)}>
                <View
                  sx={{
                    backgroundColor: selectedTheme.colors.$surfacePrimary,
                    paddingVertical: 9,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}>
                  <Text
                    variant="caption"
                    sx={{ color: selectedTheme.colors.$textSecondary }}>
                    {item.title}
                  </Text>
                  <Text
                    variant="body1"
                    sx={{
                      fontFamily: 'Inter-SemiBold',
                      color: selectedTheme.colors.$textPrimary
                    }}>
                    {'numberOfDays' in item
                      ? formatDurationInDays(item.numberOfDays)
                      : item.stakeDurationFormat ===
                          StakeDurationFormat.Custom && customDurationInDays
                      ? formatDurationInDays(customDurationInDays)
                      : 'Set'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </View>
  )
}

export const getCustomDurationIndex = (isDeveloperMode: boolean): number => {
  const durations = isDeveloperMode
    ? DURATION_OPTIONS_FUJI
    : DURATION_OPTIONS_MAINNET
  return durations.findIndex(
    duration => duration.title === StakeDurationTitle.CUSTOM
  )
}

export const getDefaultDurationIndex = (isDeveloperMode: boolean): number => {
  const durations = isDeveloperMode
    ? DURATION_OPTIONS_FUJI
    : DURATION_OPTIONS_MAINNET
  return durations.findIndex(
    duration =>
      duration.title ===
      (isDeveloperMode
        ? StakeDurationTitle.ONE_DAY
        : StakeDurationTitle.THREE_MONTHS)
  )
}
