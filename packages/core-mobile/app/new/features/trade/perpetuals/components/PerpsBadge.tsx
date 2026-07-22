import { alpha, Text, useTheme, View } from '@avalabs/k2-alpine'
import React, { type ReactNode } from 'react'

/**
 * Small read-only pill for inline labels — a builder-dex name, a category tag,
 * leverage, a status, etc. Subtle translucent background, caption text.
 */
export const PerpsBadge = ({
  children,
  uppercase = false
}: {
  children: ReactNode
  uppercase?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View
      sx={{
        backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
        borderRadius: 6,
        paddingHorizontal: 6,
        height: 18,
        justifyContent: 'center'
      }}>
      <Text
        variant="caption"
        sx={{
          fontFamily: 'Inter-Medium',
          textTransform: uppercase ? 'uppercase' : 'none'
        }}>
        {children}
      </Text>
    </View>
  )
}
