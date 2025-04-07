import {
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'
import {
  DurationOption,
  StakeDurationFormat
} from 'services/earn/getStakeEndDate'
import { getDateDurationInDays } from 'utils/date/getReadableDateDuration'

export const DurationOptions = ({
  durations,
  selectedIndex,
  onSelectDuration,
  customEndDate
}: {
  durations: DurationOption[]
  selectedIndex?: number
  onSelectDuration: (selectedIndex: number) => void
  customEndDate?: Date
}): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
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
              ? getDateDurationInDays(customEndDate, today)
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
