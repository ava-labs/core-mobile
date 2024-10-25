import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'

const BackBarButton = (): JSX.Element => {
  return (
    // todo: use k2-alpine icon
    <View style={{ paddingLeft: 18, backgroundColor: 'transparent' }}>
      <Text>{'<<'}</Text>
    </View>
  )
}

export default BackBarButton
