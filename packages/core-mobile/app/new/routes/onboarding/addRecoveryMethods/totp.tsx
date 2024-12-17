import { View } from 'react-native'
import React from 'react'
import { Text } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'

const TotpScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <View style={{ flex: 1, marginHorizontal: 16, marginTop: 25 }}>
        <Text variant="heading2">Authenticator setup</Text>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default TotpScreen
