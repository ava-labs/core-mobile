import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'

const BackButtonIcon = (): JSX.Element => {
  return (
    // todo: customise back image
    <View sx={{ paddingLeft: 18 }}>
      <Text>{'<<'}</Text>
    </View>
  )
}

export default BackButtonIcon
