import {
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { DurationOption } from 'services/earn/getStakeEndDate'
import { FlatList } from 'react-native'
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
    debouncedUpdate(selectedIndex)
  }, [selectedIndex, debouncedUpdate])

  const renderItem = useCallback(
    ({ item, index }: { item: DurationOption; index: number }) => {
      const isSelected = index === debouncedSelectedIndex
      const selectedTheme = isSelected ? inversedTheme : theme

      return (
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => handleSelectDuration(index)}>
          <View
            sx={{
              backgroundColor: isSelected
                ? selectedTheme.colors.$surfacePrimary
                : '#A1A1AA40',
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
              {'numberOfDays' in item ? `${item.numberOfDays} days` : 'Set'}
            </Text>
          </View>
        </TouchableOpacity>
      )
    },
    [debouncedSelectedIndex, handleSelectDuration, theme, inversedTheme]
  )

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 8 }}
      data={durations}
      renderItem={renderItem}
      numColumns={3}
      keyExtractor={item => item.title}
      columnWrapperStyle={{
        gap: 12
      }}
    />
  )
}
