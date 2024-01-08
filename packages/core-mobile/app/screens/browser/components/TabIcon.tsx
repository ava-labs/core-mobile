import { Text, TouchableHighlight } from '@avalabs/k2-mobile'
import React from 'react'

interface Props {
  numberOfTabs?: number
  onPress?: () => void
}

export const TabIcon = ({ numberOfTabs, onPress }: Props): JSX.Element => {
  return (
    <TouchableHighlight
      onPress={onPress}
      sx={{
        backgroundColor: '$transparent',
        borderWidth: 3,
        borderColor: '$neutral900',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4
      }}>
      <Text
        sx={{
          marginHorizontal: 4,
          color: '$neutral900',
          fontWeight: '700'
        }}>
        {numberOfTabs ?? 0}
      </Text>
    </TouchableHighlight>
  )
}
