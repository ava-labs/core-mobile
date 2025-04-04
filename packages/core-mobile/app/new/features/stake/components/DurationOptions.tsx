import {
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { DurationOption } from 'services/earn/getStakeEndDate'
import debounce from 'lodash.debounce'

export const DurationOptions = ({
  durations,
  selectedIndex,
  onSelectDuration
}: {
  durations: DurationOption[]
  selectedIndex?: number
  onSelectDuration: (selectedIndex: number) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })

  // Mirror selectedIndex to a debounced state variable.
  const [debouncedSelectedIndex, setDebouncedSelectedIndex] = useState<
    number | undefined
  >(selectedIndex)

  // Create a stable debounced function using lodash
  const debouncedUpdate = useMemo(
    () =>
      debounce((newValue: number | undefined) => {
        setDebouncedSelectedIndex(newValue)
      }, 300),
    []
  )

  const handleSelectDuration = useCallback(
    (index: number): void => {
      onSelectDuration(index)
      setDebouncedSelectedIndex(index)
    },
    [onSelectDuration]
  )

  // Update the debounced state whenever selectedIndex changes.
  useEffect(() => {
    if (selectedIndex === undefined) {
      setDebouncedSelectedIndex(5)
    } else {
      debouncedUpdate(selectedIndex)
    }
  }, [selectedIndex, debouncedUpdate])

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
            const isSelected = globalIndex === debouncedSelectedIndex
            const selectedTheme = isSelected ? inversedTheme : theme

            return (
              <TouchableOpacity
                key={item.title}
                style={{ flex: 1 }}
                onPress={() => handleSelectDuration(globalIndex)}>
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
