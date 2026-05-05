import { useTheme, View, alpha } from '@avalabs/k2-alpine'
import React from 'react'

export const SQUIRCLE_ICON_SIZE = 40

export const SquircleIcon = ({
  children,
  size = SQUIRCLE_ICON_SIZE
}: {
  children: React.ReactNode
  size?: number
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: alpha(theme.colors.$primary, 0.15),
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      {children}
    </View>
  )
}
