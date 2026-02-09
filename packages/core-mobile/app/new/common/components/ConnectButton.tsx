import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import NavigationBarButton from './NavigationBarButton'

export const ConnectButton = forwardRef<RNView>((props, ref): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()

  const handlePress = (): void => {
    // @ts-ignore
    navigate('/walletConnectScan')
  }

  return (
    <NavigationBarButton ref={ref} onPress={handlePress} testID="connect_icon">
      <View
        sx={{
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Custom.QRScanCustom color={theme.colors.$textPrimary} />
      </View>
    </NavigationBarButton>
  )
})
