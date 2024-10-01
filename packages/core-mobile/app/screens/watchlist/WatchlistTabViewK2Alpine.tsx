import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'

const WatchlistTabK2Alpine = (): JSX.Element => {
  return (
    <View sx={{ flex: 1, backgroundColor: '$surfacePrimary' }}>
      <Text variant="heading1" sx={{ color: '$textPrimary' }}>
        Hello from K2 Alpine
      </Text>
    </View>
  )
}

export default WatchlistTabK2Alpine
