import React, { useCallback } from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const insets = useSafeAreaInsets()

  const handleOnSuccess = useCallback(
    (address: string): void => {
      replace({
        pathname: '/send/send',
        params: { to: address, recipientType: 'address' }
      })
    },
    [replace]
  )

  return (
    <View sx={{ paddingHorizontal: 16, paddingTop: insets.top + 16, flex: 1 }}>
      <Text variant="heading2">Scan a QR code</Text>
      <QrCodeScanner
        onSuccess={handleOnSuccess}
        vibrate={true}
        sx={{
          height: '80%',
          width: '100%',
          marginTop: 21
        }}
      />
    </View>
  )
}
