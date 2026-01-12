import { Text, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AddressType } from 'features/accountSettings/consts'
import React, { useCallback } from 'react'

const ScanQrCodeScreen = (): React.JSX.Element => {
  const { addressType } = useLocalSearchParams<{ addressType: AddressType }>()
  const { dismiss, setParams } = useRouter()
  const headerHeight = useHeaderHeight()
  const handleOnSuccess = useCallback(
    (address: string): void => {
      dismiss()
      setParams({ address, addressType } as never)
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
