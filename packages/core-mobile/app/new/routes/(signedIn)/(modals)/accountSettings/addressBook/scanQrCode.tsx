import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { AddressType } from 'features/accountSettings/consts'
import { useHeaderHeight } from '@react-navigation/elements'

const ScanQrCodeScreen = (): React.JSX.Element => {
  const { addressType } = useLocalSearchParams<{ addressType: AddressType }>()
  const { dismiss, setParams } = useRouter()
  const headerHeight = useHeaderHeight()
  const handleOnSuccess = useCallback(
    (address: string): void => {
      dismiss()
      setParams({ address, addressType })
    },
    [addressType, dismiss, setParams]
  )

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
