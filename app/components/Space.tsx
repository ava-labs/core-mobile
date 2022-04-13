import React from 'react'
import { View } from 'react-native'

export function Space({ x, y }: { x?: number; y?: number }): JSX.Element {
  return (
    <View
      style={[
        {
          height: y ?? 0,
          width: x ?? 0
        }
      ]}
    />
  )
}
