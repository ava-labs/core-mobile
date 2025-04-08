import {
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { differenceInDays } from 'date-fns'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  DURATION_OPTIONS_FUJI,
  DURATION_OPTIONS_MAINNET,
  StakeDurationFormat,
  StakeDurationTitle
} from 'services/earn/getStakeEndDate'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const DurationOptions = ({
  selectedIndex,
  onSelectDuration,
  customEndDate
}: {
  selectedIndex?: number
  onSelectDuration: (selectedIndex: number) => void
  customEndDate?: Date
}): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const durations = useMemo(
    () => (isDeveloperMode ? DURATION_OPTIONS_FUJI : DURATION_OPTIONS_MAINNET),
    [isDeveloperMode]
  )
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  const rows = useMemo(() => {
    const chunks = []
    for (let i = 0; i < durations.length; i += 3) {
      chunks.push(durations.slice(i, i + 3))
    }
    return chunks
  }, [durations])

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
            const customDurationInDays = customEndDate
              ? differenceInDays(customEndDate, today)
              : undefined

            return (
              <TouchableOpacity
                key={item.title}
                style={{ flex: 1 }}
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
                      fontWeight: 500,
                      color: selectedTheme.colors.$textPrimary
                    }}>
                    {'numberOfDays' in item
                      ? `${item.numberOfDays} days`
                      : item.stakeDurationFormat ===
                          StakeDurationFormat.Custom && customDurationInDays
                      ? `${customDurationInDays} days`
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
