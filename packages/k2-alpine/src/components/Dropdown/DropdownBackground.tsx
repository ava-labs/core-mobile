import { BlurView } from 'expo-blur'
import React from 'react'
import { Platform } from 'react-native'
import { View } from '../Primitives'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'

export const DropdownBackground = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { theme } = useTheme()

  return Platform.OS === 'ios' ? (
    <BlurView
      tint={'default'}
      style={{
        minWidth: 240
      }}
      intensity={100}
      experimentalBlurMethod="dimezisBlurView">
      {children}
    </BlurView>
  ) : (
    <View
      sx={{
        backgroundColor: theme.isDark
          ? colors.$neutral950
          : colors.$neutralWhite
      }}>
      {children}
    </View>
  )
}
