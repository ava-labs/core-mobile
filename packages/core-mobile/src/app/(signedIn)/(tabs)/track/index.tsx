import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import useHomeScreenHeader from 'hooks/useHomeScreenHeader'

const TrackHomeScreen = (): JSX.Element => {
  useHomeScreenHeader()

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3" sx={{ color: 'black' }}>
        Track
      </Text>
    </View>
  )
}

export default TrackHomeScreen
