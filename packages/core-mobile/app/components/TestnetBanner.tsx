import { Text, View } from '@avalabs/k2-mobile'
import { useVariableSafeAreaInsets } from 'hooks/useVariableSafeAreaInsets'
import React, { FC } from 'react'

const TestnetBanner: FC = () => {
  const { top } = useVariableSafeAreaInsets()
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
