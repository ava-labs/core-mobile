import React, { useCallback } from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useSendContext } from '../context/sendContext'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const { resetAmount, setToAddress } = useSendContext()

  const handleOnSuccess = useCallback(
    (address: string): void => {
      setToAddress({ to: address, recipientType: 'address' })
      resetAmount()
      replace({
        pathname: '/send/send',
        params: { to: address, recipientType: 'address' }
      })
    },
    [replace, resetAmount, setToAddress]
  )

  return (
    <View sx={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
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
