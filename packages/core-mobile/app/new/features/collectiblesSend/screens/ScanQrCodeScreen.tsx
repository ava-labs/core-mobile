import React, { useCallback } from 'react'
import { Button, Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useSendContext } from 'features/send/context/sendContext'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const { setToAddress } = useSendContext()

  const handleOnSuccess = useCallback(
    (address: string): void => {
      setToAddress({ to: address, recipientType: 'address' })
      replace({
        pathname: '/collectiblesSend/approval'
        // params: { nftId }
      })
    },
    [replace, setToAddress]
  )

  return (
    <View sx={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
      <Text variant="heading2">Scan a QR code</Text>

      <Button
        size="large"
        type="tertiary"
        onPress={() =>
          replace({
            pathname: '/collectiblesSend/approval'
            // params: { nftId }
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
