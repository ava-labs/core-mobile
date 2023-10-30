import React from 'react'
import { TouchableOpacity, Text } from '../Primitives'

export const ExampleButton = (): JSX.Element => {
  return (
    <TouchableOpacity
      sx={{
        backgroundColor: '$neutral50',
        paddingVertical: 10,
        paddingHorizontal: 20
      }}
      onPress={() => {
        // @ts-expect-error
        // eslint-disable-next-line no-alert
        alert('hello')
      }}>
      <Text variant="buttonMedium">Example Button</Text>
    </TouchableOpacity>
  )
}
