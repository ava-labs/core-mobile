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
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { copyToClipboard } from 'common/utils/clipboard'
import { router } from 'expo-router'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  NETWORK_P,
  NETWORK_P_TEST,
  NETWORK_X,
  NETWORK_X_TEST
} from 'services/network/consts'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { QRCode } from '../components/QRCode'
import { HORIZONTAL_MARGIN } from '../consts'
import { useReceiveStore } from '../store'

export const ReceiveScreen = memo((): React.JSX.Element => {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { availableNetworks, networks } = usePrimaryNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const selectedNetwork = useReceiveStore(state => state.selectedNetwork)
  const setSelectedNetwork = useReceiveStore(state => state.setSelectedNetwork)
  const activeAccount = useSelector(selectActiveAccount)

  const isXPChain =
    selectedNetwork?.chainId === ChainId.AVALANCHE_XP ||
    selectedNetwork?.chainId === ChainId.AVALANCHE_TEST_XP

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

  useEffect(() => {
    // Set default network if no network is selected
    if (!selectedNetwork && availableNetworks[0]) {
      setSelectedNetwork(availableNetworks[0])
    }
  }, [availableNetworks, selectedNetwork, setSelectedNetwork])

  useEffect(() => {
    // Update the selected network if the user toggles developer mode
    if (selectedNetwork?.isTestnet && !isDeveloperMode) {
      const foundNetwork = networks.find(
        network =>
          network.vmName === selectedNetwork?.vmName && !network.isTestnet
      )

      if (foundNetwork) {
        setSelectedNetwork(foundNetwork)
      }
    } else if (!selectedNetwork?.isTestnet && isDeveloperMode) {
      const foundNetwork = networks.find(
        network =>
          network.vmName === selectedNetwork?.vmName && network.isTestnet
      )

      if (foundNetwork) {
        setSelectedNetwork(foundNetwork)
      }
    }
  }, [
    isDeveloperMode,
    networks,
    selectedNetwork?.isTestnet,
    selectedNetwork?.vmName,
    setSelectedNetwork
  ])

  useEffect(() => {
    AnalyticsService.capture('ReceivePageVisited')
  }, [])

  const walletAddreses = useMemo(() => {
    if (isXPChain) {
      const addressP = activeAccount?.addressPVM ?? ''
      const addressX = activeAccount?.addressAVM ?? ''
      const networkX = selectedNetwork?.isTestnet ? NETWORK_X_TEST : NETWORK_X
      const networkP = selectedNetwork?.isTestnet ? NETWORK_P_TEST : NETWORK_P

      return [
        {
          title: networkX.isTestnet
            ? 'Avalanche X-Chain Testnet'
            : 'Avalanche X-Chain',
          subtitle: addressX?.replace('-', '\u2011'), // to prevent word wrap because of the dash
          leftIcon: (
            <TokenLogo
              symbol={networkX.networkToken?.symbol ?? 'AVAX'}
              isNetworkToken
              size={24}
            />
          ),
          value: (
            <Button
              type="secondary"
              size="small"
              onPress={() =>
                onCopyAddress(addressX, `${networkX.chainName} address copied`)
              }>
              Copy
            </Button>
          )
        },
        {
          title: networkP.isTestnet
            ? 'Avalanche P-Chain Testnet'
            : 'Avalanche P-Chain',
          subtitle: addressP?.replace('-', '\u2011'), // to prevent word wrap because of the dash
          leftIcon: (
            <TokenLogo
              symbol={networkP.networkToken?.symbol ?? 'AVAX'}
              isNetworkToken
              size={24}
            />
          ),
          value: (
            <Button
              type="secondary"
              size="small"
              onPress={() =>
                onCopyAddress(addressP, `${networkP.chainName} address copied`)
              }>
              Copy
            </Button>
          )
        }
      ]
    }

    return [
      {
        title: selectedNetwork?.chainName ?? 'Avalanche C-Chain',
        subtitle: address.replace('-', '\u2011'), // to prevent word wrap because of the dash
        leftIcon: (
          <TokenLogo
            symbol={selectedNetwork?.networkToken?.symbol ?? 'AVAX'}
            isNetworkToken
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
    ]
  }, [
    isXPChain,
    selectedNetwork?.chainName,
    selectedNetwork?.networkToken?.symbol,
    selectedNetwork?.isTestnet,
    address,
    activeAccount?.addressPVM,
    activeAccount?.addressAVM
  ])

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
        <Text variant="subtitle1">
          To receive funds you can choose to share your unique QR code or
          address below with the sender
        </Text>
      </View>

      <View
        style={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          flex: 1
        }}>
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
        <View style={{ flex: isXPChain ? 0.5 : 1 }} />
      </View>

      <GroupList data={walletAddreses} textContainerSx={{ flex: 1 }} />
    </View>
  )
})
