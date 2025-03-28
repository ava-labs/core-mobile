import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import React from 'react'

interface Props {
  numberOfTabs?: number
  onPress?: () => void
}

export const TabIcon = ({ numberOfTabs, onPress }: Props): JSX.Element => {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ left: 15, right: 15, top: 15, bottom: 15 }}
      sx={{
        backgroundColor: '$transparent',
        borderWidth: 2,
        borderColor: '$neutral50',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4
      }}>
      <Text
        variant="caption"
        sx={{
          marginHorizontal: 4,
          color: '$neutral50',
          fontWeight: '700'
        }}>
        {numberOfTabs ?? 0}
      </Text>
    </TouchableOpacity>
  )
}
