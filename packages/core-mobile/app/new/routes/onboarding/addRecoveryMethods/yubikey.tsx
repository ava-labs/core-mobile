import { View } from 'react-native'
import React from 'react'
import { Text } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'

const YubikeyScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <View style={{ flex: 1, marginHorizontal: 16, marginTop: 25 }}>
        <Text variant="heading2">How would you like to name your YubiKey?</Text>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default YubikeyScreen
