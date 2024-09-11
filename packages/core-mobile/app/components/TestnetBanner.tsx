import { Text, View } from '@avalabs/k2-mobile'
import React, { FC } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TestnetBanner: FC = () => {
  const { top } = useSafeAreaInsets()
  return (
    <View
      testID="testnet_banner"
      sx={{
        backgroundColor: '$warningMain',
        paddingBottom: 4,
        paddingTop: top,
        paddingHorizontal: 16
      }}>
      <Text variant="alertTitle" sx={{ color: '$black' }}>
        Testnet
      </Text>
    </View>
  )
}

export default TestnetBanner
