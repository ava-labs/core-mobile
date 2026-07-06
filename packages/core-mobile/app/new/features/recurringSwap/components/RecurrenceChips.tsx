import React from 'react'
import {
  alpha,
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'

export type ChipOption<T extends string> = {
  id: T
  label: string
}

type Props<T extends string> = {
  options: ChipOption<T>[]
  /** `undefined` = no chip rendered as selected. Pass an explicit id when
   *  you want to highlight a default; otherwise the grid renders all chips
   *  in the unselected style so the user knows the form isn't valid yet. */
  selectedId: T | undefined
  onSelect: (id: T) => void
  columns?: number
  testID?: string
}

// Chip grid styled to match GasOptions / DurationOptions — filled background
// on the selected chip, semi-transparent fill on unselected. Mirrors the
// existing "chips + Custom" pattern used by network fee and stake duration.
export function RecurrenceChips<T extends string>({
  options,
  selectedId,
  onSelect,
  columns = 3,
  testID
}: Props<T>): JSX.Element {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const {
    theme: { colors: inversedColors }
  } = useInversedTheme({ isDark })

  const rows: (ChipOption<T> | null)[][] = []
  for (let i = 0; i < options.length; i += columns) {
    const row: (ChipOption<T> | null)[] = options.slice(i, i + columns)
    while (row.length < columns) row.push(null)
    rows.push(row)
  }

  return (
    <View sx={{ gap: 8 }} testID={testID}>
      {rows.map(row => (
        // Key by row content so reordering options (today only static, but
        // safe for future use) doesn't recycle row state across mismatched
        // chips.
        <View
          key={row.map(r => r?.id ?? 'empty').join('-')}
          sx={{
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'space-between'
          }}>
          {row.map((item, colIndex) => {
            if (!item) {
              return <View key={`empty-${colIndex}`} sx={{ flex: 1 }} />
            }

            // Explicit undefined check — comparing `undefined === 'hourly'`
            // is correctly false, but stating the intent here makes the
            // "no selection yet" path obvious to a future reader.
            const isSelected =
              selectedId !== undefined && item.id === selectedId
            const backgroundColor = isDark
              ? isSelected
                ? colors.$textPrimary
                : colors.$surfacePrimary
              : isSelected
              ? inversedColors.$surfaceTertiary
              : alpha(colors.$textPrimary, 0.1)
            const textColor = (!isSelected ? colors : inversedColors)
              .$textPrimary

            return (
              <TouchableOpacity
                key={item.id}
                style={{ flex: 1 }}
                onPress={() => onSelect(item.id)}
                testID={`chip_${item.id}`}>
                <View
                  sx={{
                    backgroundColor,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderRadius: 12
                  }}>
                  <Text
                    variant="body1"
                    sx={{
                      color: textColor,
                      fontSize: 15,
                      lineHeight: 20,
                      fontFamily: 'Inter-Medium'
                    }}>
                    {item.label}
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
