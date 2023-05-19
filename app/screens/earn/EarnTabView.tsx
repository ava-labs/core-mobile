import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'

export default function EarnTabView() {
  return (
    <View style={{ flex: 1 }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Earn
      </AvaText.LargeTitleBold>
    </View>
  )
}
