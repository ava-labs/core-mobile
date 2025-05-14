import { showAlert, Text, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { isValidAddressByVmName } from 'features/accountSettings/utils/isValidAddressByVmName'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSendContext } from '../context/sendContext'

export const ScanQrCodeScreen = (): JSX.Element => {
  const headerHeight = useHeaderHeight()
  const { replace } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { resetAmount, setToAddress } = useSendContext()
  const { vmName } = useGlobalSearchParams<{ vmName: NetworkVMType }>()

  const handleOnSuccess = useCallback(
    (address: string): void => {
      const isValidAddress = isValidAddressByVmName({
        address,
        vmName,
        isDeveloperMode
      })
      if (isValidAddress === false) {
        showAlert({
          title: 'Invalid address',
          description:
            vmName === undefined
              ? undefined
              : 'The address is not valid for the selected network.',
          buttons: [
            {
              text: 'Got it'
            }
          ]
        })
        return
      }

      setToAddress({ to: address, recipientType: 'address' })
      resetAmount()
      replace({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/send/send',
        params: { to: address, recipientType: 'address' }
      })
    },
    [isDeveloperMode, replace, resetAmount, setToAddress, vmName]
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
