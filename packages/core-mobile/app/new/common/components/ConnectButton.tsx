import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsWalletConnectBlocked } from 'store/posthog'
import NavigationBarButton from './NavigationBarButton'

export const ConnectButton = forwardRef<RNView>(
  (props, ref): JSX.Element | null => {
    const { theme } = useTheme()
    const { navigate } = useRouter()
    const isWalletConnectBlocked = useSelector(selectIsWalletConnectBlocked)

    if (isWalletConnectBlocked) {
      return null
    }

    const handlePress = (): void => {
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
  }
)
