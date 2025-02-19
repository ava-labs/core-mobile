import { Text, View } from '@avalabs/k2-alpine'
import { QrCodeScanner } from 'features/portfolio/components/QrCodeScanner'
import React from 'react'
import { useRouter } from 'expo-router'

const ScanQrCodeScreen = (): JSX.Element => {
  const { dismiss, setParams } = useRouter()
  const handleOnSuccess = (data: string): void => {
    dismiss()
    setParams({ tokenAddress: data })
  }

  return (
    <View sx={{ padding: 16, flex: 1 }}>
      <Text variant="heading2">Scan a QR code</Text>
      <QrCodeScanner
        onSuccess={event => handleOnSuccess(event.data)}
        sx={{
          flex: 1,
          borderRadius: 18,
          overflow: 'hidden',
          marginTop: 21,
          marginBottom: 83
        }}
      />
    </View>
  )
}

export default ScanQrCodeScreen
