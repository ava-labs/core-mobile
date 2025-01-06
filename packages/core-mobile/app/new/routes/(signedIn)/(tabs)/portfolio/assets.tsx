import React from 'react'
import { View, Text, ScrollView } from '@avalabs/k2-alpine'
import {} from 'react-native-gesture-handler'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'

const PortfolioAssetsScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <ScrollView
        sx={{
          flex: 1
        }}
        contentContainerSx={{
          paddingTop: 16,
          flex: 1,
          alignItems: 'center',
          gap: 16
        }}>
        <View>
          <Text variant="heading3">Assets</Text>
        </View>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioAssetsScreen
