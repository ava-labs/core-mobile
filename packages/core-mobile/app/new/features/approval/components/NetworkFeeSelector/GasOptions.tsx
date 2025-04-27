import {
  Text,
  TouchableOpacity,
  useInversedTheme,
  useTheme,
  alpha,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { FeePreset } from '../../types'

const presets = Object.values(FeePreset)

export const GasOptions = ({
  selectedPreset,
  onSelectPreset
}: {
  selectedPreset: FeePreset
  onSelectPreset: (preset: FeePreset) => void
}): JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const {
    theme: { colors: inversedColors }
  } = useInversedTheme({ isDark })

  return (
    <View
      sx={{
        padding: 16,
        gap: 8,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly'
      }}>
      {presets.map((item, index) => {
        const isSelected = selectedPreset === item
        const backgroundColor = isDark
          ? isSelected
            ? colors.$textPrimary
            : colors.$surfacePrimary
          : isSelected
          ? inversedColors.$surfaceTertiary
          : alpha(colors.$textPrimary, 0.1)

        // ? alpha(
        //   (!isSelected ? colors : colors).$textPrimary,
        //   0.1
        // )

        // 10% 850

        const textColor = (!isSelected ? colors : inversedColors).$textPrimary

        return (
          <View
            key={index}
            sx={{
              flexDirection: 'row',
              flexGrow: 1
            }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => onSelectPreset(item)}>
              <View
                sx={{
                  backgroundColor,
                  paddingVertical: 16,
                  alignItems: 'center',
                  borderRadius: 12
                }}>
                <Text
                  variant="body1"
                  sx={{
                    color: textColor,
                    fontSize: 15,
                    lineHeight: 20,
                    fontWeight: '500'
                  }}>
                  {item}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
}
