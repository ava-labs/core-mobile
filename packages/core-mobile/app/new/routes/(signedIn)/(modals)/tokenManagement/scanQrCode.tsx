import { Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const ScanQrCodeScreen = (): JSX.Element => {
  const { dismiss, setParams } = useDebouncedRouter()

  const handleOnSuccess = (tokenAddress: string): void => {
    dismiss()
    setParams({ tokenAddress })
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
