import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Icons, Text, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { router } from 'expo-router'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  SelectedNetworkKey,
  useSelectedNetwork
} from 'common/store/selectedNetwork'
import { AccountAddresses } from '../components/AccountAddresses'
import { QRCode } from '../components/QRCode'
import { HORIZONTAL_MARGIN } from '../consts'
import { isXPChain } from '../utils'

export const ReceiveScreen = (): ReactNode => {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { networks } = usePrimaryNetworks()

  const [selectedNetwork, setSelectedNetwork] = useSelectedNetwork(
    SelectedNetworkKey.RECEIVE
  )

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)

  const address = useMemo(() => {
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
  }, [activeAccount, selectedNetwork])

  const qrCodeAddress = useMemo(() => {
    if (isXPChain(selectedNetwork?.chainId)) return address.split('-')[1]
    return address
  }, [address, selectedNetwork])

  const refreshSelectedNetwork = useCallback(() => {
    if (selectedNetwork?.isTestnet && !isDeveloperMode) {
      const foundNetwork = networks.find(
        network =>
          network.vmName === selectedNetwork.vmName && !network.isTestnet
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
  }, [isDeveloperMode, networks, selectedNetwork, setSelectedNetwork])

  // Update the selected network if the user toggles developer mode
  useEffect(() => {
    refreshSelectedNetwork()
  }, [refreshSelectedNetwork])

  useEffect(() => {
    AnalyticsService.capture('ReceivePageVisited')
  }, [])

  const openSelectTokenScreen = useCallback(() => {
    router.push({
      pathname: '/selectReceiveNetwork'
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
          address={qrCodeAddress}
          token={selectedNetwork?.networkToken?.symbol ?? 'AVAX'}
          label={selectedNetwork?.chainName}
        />
        <View style={{ flex: isXPChain(selectedNetwork?.chainId) ? 0.5 : 1 }} />
      </View>

      <AccountAddresses address={address} />
    </View>
  )
}
