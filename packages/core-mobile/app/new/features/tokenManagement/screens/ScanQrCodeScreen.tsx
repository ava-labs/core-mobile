import { Text, View } from '@avalabs/k2-alpine'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useRouter } from 'expo-router'
import React from 'react'
import { useTokenAddress } from '../store'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { dismiss } = useRouter()
  const headerHeight = useEffectiveHeaderHeight()
  const [tokenAddress, setTokenAddress] = useTokenAddress()

  const handleOnSuccess = (address: string): void => {
    if (tokenAddress) return
    setTokenAddress(address)
    dismiss()
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
