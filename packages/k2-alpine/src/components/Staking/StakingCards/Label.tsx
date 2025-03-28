import { SxProp } from 'dripsy'
import React from 'react'
import { Platform } from 'react-native'
import { Text } from '../../Primitives'

export const Label = ({
  sx,
  children
}: {
  sx?: SxProp
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Text
      sx={{
        fontFamily: 'Aeonik-Bold',
        fontSize: 24,
        lineHeight: Platform.OS === 'ios' ? 22 : 24,
        ...sx
      }}>
      {children}
    </Text>
  )
}
