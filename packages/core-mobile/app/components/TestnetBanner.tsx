import { Text, View } from '@avalabs/k2-mobile'
import React, { FC } from 'react'

const TestnetBanner: FC = () => {
  return (
    <View
      testID="testnet_banner"
      sx={{
        backgroundColor: '$warningMain',
        paddingVertical: 4,
        paddingHorizontal: 16
      }}>
      <Text variant="alertTitle" sx={{ color: '$black' }}>
        Testnet
      </Text>
    </View>
  )
}

export default TestnetBanner
