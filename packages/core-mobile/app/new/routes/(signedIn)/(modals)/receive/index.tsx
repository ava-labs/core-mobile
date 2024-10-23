import React from 'react'
import { Text, View } from '@avalabs/k2-alpine'

const ReceiveScreen = (): JSX.Element => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3" sx={{ color: 'black' }}>
        Receive
      </Text>
    </View>
  )
}

export default ReceiveScreen
