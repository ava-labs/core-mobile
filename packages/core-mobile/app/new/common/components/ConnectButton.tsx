import { Icons, TouchableOpacity, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'

export const ConnectButton = forwardRef<RNView>((props, ref): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()

  const handlePress = (): void => {
    // @ts-ignore
    navigate('/walletConnectScan')
  }

  return (
    <TouchableOpacity
      ref={ref}
      // onPress doesn't work for Android when using svgs (only on production)
      onPressOut={handlePress}
      testID="connect_icon"
      style={{
        paddingLeft: 14,
        paddingRight: 8,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <View
        sx={{
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Custom.QRScanCustom color={theme.colors.$textPrimary} />
      </View>
    </TouchableOpacity>
  )
})
