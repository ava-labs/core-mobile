import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'

const StakeHomeScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16
        }}>
        <Text variant="heading3">Stake</Text>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default StakeHomeScreen
