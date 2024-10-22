import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import useHomeScreenHeader from 'hooks/useHomeScreenHeader'
import BlurredBarsContentLayout from 'components/navigation/BlurredBarsContentLayout'

const StakeHomeScreen = (): JSX.Element => {
  useHomeScreenHeader()

  return (
    <BlurredBarsContentLayout>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16
        }}>
        <Text variant="heading3" sx={{ color: 'black' }}>
          Stake
        </Text>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default StakeHomeScreen
