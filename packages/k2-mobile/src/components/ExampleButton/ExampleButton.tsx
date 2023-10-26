import React from 'react'
import { TouchableOpacity, Text } from '../Primitives'

export const ExampleButton = (): JSX.Element => {
  return (
    <TouchableOpacity
      sx={{ backgroundColor: '$primary' }}
      onPress={() => {
        // @ts-expect-error
        // eslint-disable-next-line no-alert
        alert('hello')
      }}>
      <Text>Example Button</Text>
    </TouchableOpacity>
  )
}
