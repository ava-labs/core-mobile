import React, { useCallback, useState } from 'react'
import { View, Text, TextInput, Tooltip } from '@avalabs/k2-alpine'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const WalletConnectScanScreen = (): React.JSX.Element => {
  const router = useRouter()
  const { setPendingDeepLink } = useDeeplink()
  const [wcLink, setWcLink] = useState('')
  const insets = useSafeAreaInsets()

  const handleOnChangeText = useCallback(
    (value: string) => {
      setWcLink(value)
      setPendingDeepLink({
        url: value,
        origin: DeepLinkOrigin.ORIGIN_QR_CODE
      })
      router.canGoBack() && router.back()
    },
    [router, setPendingDeepLink]
  )

  return (
    <View
      sx={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 16,
        flex: 1,
        marginBottom: 80
      }}>
      <Text variant="heading2">Scan a QR code</Text>
      <QrCodeScanner
        onSuccess={handleOnChangeText}
        vibrate={true}
        sx={{
          height: '80%',
          width: '100%',
          marginTop: 21
        }}
      />
      <View style={{ flexDirection: 'row', marginVertical: 16 }}>
        <Text sx={{ marginRight: 8, color: '$textPrimary' }} variant="body1">
          Connection URI
        </Text>
        <Tooltip
          title="Connection URI"
          description="Use this to manually connect"
        />
      </View>
      <TextInput
        value={wcLink}
        onChangeText={handleOnChangeText}
        placeholder="example: wc:07e46b69-98c4-4..."
      />
    </View>
  )
}
