import { ChainId, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  GroupList,
  Icons,
  Text,
  TouchableOpacity,
  useTheme
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { copyToClipboard } from 'common/utils/clipboard'
import { router } from 'expo-router'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { NetworkWithCaip2ChainId } from 'store/network'
import { QRCode } from '../components/QRCode'
import { HORIZONTAL_MARGIN } from '../consts'

const RECEIVING_NETWORKS = [
  ChainId.AVALANCHE_MAINNET_ID,
  ChainId.AVALANCHE_P,
  ChainId.AVALANCHE_X,
  ChainId.ETHEREUM_HOMESTEAD,
  ChainId.BITCOIN
]

export const ReceiveScreen = memo((): React.JSX.Element => {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  const { allNetworks } = useNetworks()

  const activeAccount = useSelector(selectActiveAccount)

  const availableNetworks = useMemo(
    () =>
      RECEIVING_NETWORKS.map(chainId => allNetworks[chainId]).filter(
        item => item
      ),
    [allNetworks]
  )

  const defaultNetwork: NetworkWithCaip2ChainId = useMemo(() => {
    if (availableNetworks.length === 0) {
      throw new Error('No available networks found')
    }
    return availableNetworks[0] as NetworkWithCaip2ChainId
  }, [availableNetworks])

  const [selectedNetwork, setSelectedNetwork] =
    useState<NetworkWithCaip2ChainId>(defaultNetwork)

  const { networkToken, chainName, vmName } = selectedNetwork

  useEffect(() => {
    AnalyticsService.capture('ReceivePageVisited')
  }, [])

  const address = useMemo((): string => {
    switch (vmName) {
      case NetworkVMType.BITCOIN:
        return activeAccount?.addressBTC ?? ''
      case NetworkVMType.AVM:
        return activeAccount?.addressAVM ?? ''
      case NetworkVMType.PVM:
        return activeAccount?.addressPVM ?? ''
      case NetworkVMType.EVM:
      default:
        return activeAccount?.addressC ?? ''
    }
  }, [vmName, activeAccount])

  const onCopyAddress = (value: string, message: string): void => {
    copyToClipboard(value, message)
  }

  const data = [
    {
      title: selectedNetwork.chainName,
      subtitle: address,
      leftIcon: <TokenLogo symbol={networkToken?.symbol} size={24} />,
      value: (
        <CopyButton
          testID="copy_address"
          onPress={() =>
            onCopyAddress(
              address,
              `${selectedNetwork.chainName} address copied`
            )
          }
        />
      )
    }
  ]

  const onChange = useCallback(
    (networkId: string) => {
      const foundNetwork = availableNetworks.find(
        network => network.chainId.toString() === networkId
      )
      if (foundNetwork) {
        setSelectedNetwork(foundNetwork)
      }
    },
    [availableNetworks]
  )

  const openSelectTokenScreen = useCallback(() => {
    router.push({
      pathname: '/selectNetwork',
      params: {
        selectedNetworkId: selectedNetwork.chainId,
        networks: JSON.stringify(availableNetworks),
        onChange
      }
    } as any)
  }, [selectedNetwork.chainId, availableNetworks, onChange])

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
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={openSelectTokenScreen}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.colors.$surfaceSecondary,
              paddingHorizontal: 8,
              borderRadius: 16,
              height: 31
            }}>
            <TokenLogo symbol={networkToken?.symbol} size={20} />
            <Text variant="buttonMedium">{selectedNetwork.chainName}</Text>
            <Icons.Navigation.ChevronRight
              color={theme.colors.$textSecondary}
              style={{
                transform: [{ rotate: '90deg' }]
              }}
            />
          </TouchableOpacity>
        </View>
        <QRCode
          testID="receive_token_qr_code"
          address={address}
          token={networkToken?.symbol}
          label={chainName}
        />
        <View style={{ flex: 1 }} />
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
      <Text testID={testID} variant="buttonMedium" style={{ fontSize: 14 }}>
        Copy
      </Text>
    </TouchableOpacity>
  )
}
