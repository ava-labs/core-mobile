import React from 'react'
import { View } from '@avalabs/k2-alpine'

const DEFAULT_SIZE = 32

interface FallbackTokenLogoProps {
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
}

export const FallbackTokenLogo = ({
  size = DEFAULT_SIZE,
  backgroundColor,
  borderColor,
  testID
}: FallbackTokenLogoProps): JSX.Element => {
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
