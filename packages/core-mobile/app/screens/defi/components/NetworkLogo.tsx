import React from 'react'
import { Image, ImageStyle, StyleProp } from 'react-native'

export const NetworkLogo = ({
  uri,
  size = 12,
  style
}: {
  uri?: string
  size?: number
  style?: StyleProp<ImageStyle>
  testID?: string
}) => {
  if (!uri) return null
  return (
    <Image
      source={{ uri }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2
        },
        style
      ]}
      testID="network_logo"
    />
  )
}
