import React, { useCallback } from 'react'
import { Button, Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { QrCodeScanner } from 'common/components/QrCodeScanner'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { replace } = useRouter()

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
    <View sx={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
      <Text variant="heading2">Scan a QR code</Text>

      <Button
        size="large"
        type="tertiary"
        onPress={() =>
          replace({
            pathname: '/send/send',
            params: {
              to: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F',
              recipientType: 'address'
            }
          })
        }>
        Test
      </Button>
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
