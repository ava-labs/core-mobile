import { ChainId, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  Button,
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
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { QRCode } from '../components/QRCode'
import { HORIZONTAL_MARGIN } from '../consts'
import { useReceiveStore } from '../store'

export const ReceiveScreen = memo((): React.JSX.Element => {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  const selectedNetwork = useReceiveStore(state => state.selectedNetwork)
  const setSelectedNetwork = useReceiveStore(state => state.setSelectedNetwork)

  const { allNetworks } = useNetworks()

  useEffect(() => {
    const network = Object.values(allNetworks).find(
      item => item.chainId === ChainId.AVALANCHE_MAINNET_ID
    )
    if (network) {
      setSelectedNetwork(network)
    }
  }, [allNetworks, setSelectedNetwork])

  const activeAccount = useSelector(selectActiveAccount)

  useEffect(() => {
    AnalyticsService.capture('ReceivePageVisited')
  }, [])

  const address = useMemo((): string => {
    switch (selectedNetwork?.vmName) {
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
  }, [selectedNetwork?.vmName, activeAccount])

  const data = useMemo(
    () => [
      {
        title: selectedNetwork?.chainName ?? 'Avalanche (C-Chain)',
        subtitle: address,
        leftIcon: (
          <TokenLogo
            symbol={selectedNetwork?.networkToken?.symbol ?? 'AVAX'}
            size={24}
          />
        ),
        value: (
          <Button
            type="secondary"
            size="small"
            onPress={() =>
              onCopyAddress(
                address,
                `${selectedNetwork?.chainName} address copied`
              )
            }>
            Copy
          </Button>
        )
      }
    ],
    [selectedNetwork, address]
  )

  const onCopyAddress = (value: string, message: string): void => {
    copyToClipboard(value, message)
  }

  const openSelectTokenScreen = useCallback(() => {
    router.push({
      pathname: '/selectNetwork'
    })
  }, [])

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
            <TokenLogo
              symbol={selectedNetwork?.networkToken?.symbol ?? 'AVAX'}
              size={20}
            />
            <Text variant="buttonMedium">{selectedNetwork?.chainName}</Text>
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
          token={selectedNetwork?.networkToken?.symbol}
          label={selectedNetwork?.chainName}
        />
        <View style={{ flex: 1 }} />
      </View>

      <GroupList data={data} />
    </View>
  )
})
