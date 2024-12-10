import React, { PropsWithChildren } from 'react'
import { SxProp } from 'dripsy'
import { View } from '../Primitives'
import { useTheme } from '../..'

export const Card = ({
  sx,
  children,
  shouldCenterAlign = false,
  backgroundColorOverride
}: {
  sx?: SxProp
  shouldCenterAlign?: boolean
  backgroundColorOverride?: {
    light: string
    dark: string
  }
} & PropsWithChildren): React.JSX.Element => {
  const { theme } = useTheme()

  const getBackgroundColor = (): string => {
    if (backgroundColorOverride) {
      return theme.isDark
        ? backgroundColorOverride.dark
        : backgroundColorOverride?.light
    }
    return theme.isDark ? '#3B3B3D' : '#F2F2F3'
  }

  return (
    <View
      sx={{
        borderRadius: 18,
        padding: 17,
        backgroundColor: getBackgroundColor(),
        justifyContent: shouldCenterAlign ? 'center' : undefined,
        alignItems: shouldCenterAlign ? 'center' : undefined,
        ...sx
      }}>
      {children}
    </View>
  )
}
