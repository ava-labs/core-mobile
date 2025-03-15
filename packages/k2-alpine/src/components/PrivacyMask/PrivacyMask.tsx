import React from 'react'
import { View } from '../Primitives'

export const PrivacyMask = ({
  width,
  height,
  backgroundColor
}: {
  width?: number
  height?: number
  backgroundColor?: string
}): React.JSX.Element => {
  return (
    <View
      sx={{
        backgroundColor: backgroundColor ?? '$borderPrimary',
        borderRadius: 12,
        width,
        height
      }}
    />
  )
}
