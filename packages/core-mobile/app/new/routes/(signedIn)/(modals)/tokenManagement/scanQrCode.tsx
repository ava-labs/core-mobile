import { Text, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useRouter } from 'expo-router'
import React from 'react'
const ScanQrCodeScreen = (): JSX.Element => {
  const { dismiss, setParams } = useRouter()
  const headerHeight = useHeaderHeight()
  const handleOnSuccess = (tokenAddress: string): void => {
    dismiss()
    setParams({ tokenAddress })
  }

  return (
    <View
      sx={{ paddingHorizontal: 16, paddingTop: headerHeight + 16, flex: 1 }}>
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
