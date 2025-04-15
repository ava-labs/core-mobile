import React from 'react'
import { Text, View } from '@avalabs/k2-alpine'

export const SelectTokenScreen = (): JSX.Element => {
  return (
    <View
      style={{
        flex: 1,
        marginTop: 13
      }}>
      <Text
        variant="heading2"
        style={{ marginBottom: 12, paddingLeft: 16, paddingRight: 64 }}>
        Select a token
      </Text>
    </View>
  )
}
