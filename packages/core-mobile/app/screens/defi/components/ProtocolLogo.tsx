import React from 'react'
import { Image } from 'react-native'

export const ProtocolLogo = ({
  uri,
  size = 40
}: {
  uri?: string
  size?: number
  testID?: string
}): React.JSX.Element | null => {
  if (!uri) return null
  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2
      }}
      testID="protocol_logo"
    />
  )
}
