import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
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
      onPress={handlePress}
      testID="connect_icon"
      style={{
        padding: 14,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <Icons.Custom.QRScanCustom color={theme.colors.$textPrimary} />
    </TouchableOpacity>
  )
})
