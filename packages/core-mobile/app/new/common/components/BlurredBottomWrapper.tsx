import { alpha, useTheme, View } from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useMemo } from 'react'
import { Platform } from 'react-native'

export const BottomTabWrapper = ({
  children,
  enabled = true
}: {
  children: React.ReactNode
  enabled?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const tabBarHeight = useBottomTabBarHeight()

  const colors: [string, string, ...string[]] = useMemo(
    () => [
      alpha(theme.colors.$surfacePrimary, 0),
      alpha(theme.colors.$surfacePrimary, Platform.OS === 'ios' ? 0.96 : 1),
      alpha(theme.colors.$surfacePrimary, Platform.OS === 'ios' ? 0.96 : 1)
    ],
    [theme.colors.$surfacePrimary]
  )

  return (
    <View>
      {enabled && (
        <LinearGradient
          pointerEvents="none"
          colors={colors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          locations={[0, 0.5, 1]}
          style={{
            height: 80,
            position: 'absolute',
            // keep this -4 to compensate for switching tabs effect
            bottom: tabBarHeight - 4,
            left: 0,
            right: 0
          }}
        />
      )}
      {children}
      <View
        style={{
          height: tabBarHeight
        }}
      />
    </View>
  )
}
