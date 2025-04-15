import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { GroupList, Text, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { copyToClipboard } from 'common/utils/clipboard'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { memo, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { QRCode } from '../components/QRCode'
import { HORIZONTAL_MARGIN } from '../consts'

export const ReceiveScreen = memo(() => {
  const insets = useSafeAreaInsets()
  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const { networkToken, chainName, vmName } = activeNetwork
  const addressC = activeAccount?.addressC ?? ''
  const addressBTC = activeAccount?.addressBTC ?? ''
  const addressAVM = activeAccount?.addressAVM ?? ''
  const addressPVM = activeAccount?.addressPVM ?? ''

  useEffect(() => {
    AnalyticsService.capture('ReceivePageVisited')
  }, [])

  const address = useMemo((): string => {
    switch (vmName) {
      case NetworkVMType.BITCOIN:
        return addressBTC
      case NetworkVMType.AVM:
        return addressAVM
      case NetworkVMType.PVM:
        return addressPVM
      case NetworkVMType.EVM:
      default:
        return addressC
    }
  }, [vmName, addressBTC, addressAVM, addressPVM, addressC])

  const onCopyAddress = (value: string, message: string): void => {
    copyToClipboard(value, message)
  }

  const data = [
    {
      title: activeNetwork.chainName,
      subtitle: address,
      leftIcon: <TokenLogo symbol={networkToken.symbol} size={24} />,
      value: (
        <CopyButton
          testID="copy_address"
          onPress={() =>
            onCopyAddress(address, `${activeNetwork.chainName} address copied`)
          }
        />
      )
    }
  ]

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: HORIZONTAL_MARGIN,
        paddingBottom: insets.bottom + HORIZONTAL_MARGIN * 2
      }}>
      <View
        style={{
          gap: 4
        }}>
        <Text variant="heading2">Receive crypto</Text>
        <Text variant="body1">
          To receive funds you can choose to share your unique QR code or
          address below with the sender
        </Text>
      </View>

      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <QRCode
          testID="receive_token_qr_code"
          sizePercentage={0.7}
          address={address}
          token={networkToken.symbol}
          label={chainName}
        />
      </View>

      <GroupList data={data} />
    </View>
  )
})

const CopyButton = ({
  onPress,
  testID
}: {
  onPress: () => void
  testID?: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.$borderPrimary,
        paddingHorizontal: 17,
        paddingVertical: 5,
        borderRadius: 17
      }}>
      <Text testID={testID} variant="buttonMedium" sx={{ fontSize: 14 }}>
        Copy
      </Text>
    </TouchableOpacity>
  )
}
