import React from 'react'
import { View, Text, useTheme, useInversedTheme } from '@avalabs/k2-alpine'

export const TestnetBanner = (): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme(theme)

  return (
    <View
      testID="testnetBanner"
      style={{
        height: 36,
        width: 200,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 50,
        overflow: 'visible',
        paddingHorizontal: 21,
        paddingVertical: 10
      }}>
      <Text
        variant="body2"
        style={{ color: inversedTheme.colors.$textPrimary }}>
        Testnet mode is now on
      </Text>
    </View>
  )
}
