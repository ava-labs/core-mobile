import React from 'react'
import { View, Text } from 'react-native'

const BackBarButton = (): JSX.Element => {
  return (
    // todo: use k2-alpine icon
    <View style={{ paddingLeft: 18 }}>
      <Text>{'<<'}</Text>
    </View>
  )
}

export default BackBarButton
