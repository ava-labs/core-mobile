import React from 'react'
import { View } from '@avalabs/k2-alpine'

const DEFAULT_SIZE = 32

interface FallbackLogoProps {
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
}

export const FallbackLogo = ({
  size = DEFAULT_SIZE,
  backgroundColor,
  borderColor,
  borderRadius,
  testID
}: FallbackLogoProps): JSX.Element => {
  return (
    <View
      testID={testID}
      sx={{
        width: size,
        height: size,
        borderRadius: borderRadius ?? size,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor,
        ...(borderColor && {
          borderColor,
          borderWidth: 1
        })
      }}
    />
  )
}
