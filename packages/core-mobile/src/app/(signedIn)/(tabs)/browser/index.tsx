import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import useHomeScreenHeader from '../../../../hooks/useHomeScreenHeader'

const BrowserHomeScreen = (): JSX.Element => {
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
        Browser
      </Text>
    </View>
  )
}

export default BrowserHomeScreen
