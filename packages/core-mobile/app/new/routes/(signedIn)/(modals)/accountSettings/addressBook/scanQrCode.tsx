import { useRouter } from 'expo-router'
import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import { QrCodeScanner } from 'common/components/QrCodeScanner'

const ScanQrCodeScreen = (): React.JSX.Element => {
  const { dismiss, setParams } = useRouter()

  const handleOnSuccess = (address: string): void => {
    dismiss()
    setParams({ address })
  }

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

export default ScanQrCodeScreen
