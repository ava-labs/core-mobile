import React from 'react'
import { View } from '@avalabs/k2-alpine'

const DEFAULT_SIZE = 32

interface FallbackLogoProps {
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
}

export const FallbackLogo = ({
  size = DEFAULT_SIZE,
  backgroundColor,
  borderColor,
  testID
}: FallbackLogoProps): JSX.Element => {
  return (
    <View
      testID={testID}
      sx={{
        width: size,
        height: size,
        borderRadius: size,
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
