import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Icons, Text, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useMergedNetworks } from 'common/hooks/useMergedNetworks'
import { router } from 'expo-router'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TokenLogo } from 'common/components/TokenLogo'
import { AccountAddresses } from '../components/AccountAddresses'
import { QRCode } from '../components/QRCode'
import { useReceiveSelectedNetwork } from '../store'

export const ReceiveScreen = (): ReactNode => {
  const { theme } = useTheme()
  const { networks } = useMergedNetworks()

  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)

  const address = useMemo(() => {
    switch (selectedNetwork.vmName) {
      case NetworkVMType.BITCOIN:
        return activeAccount?.addressBTC ?? ''
      case NetworkVMType.AVM:
        return activeAccount?.addressAVM.split('-')[1] ?? ''
      case NetworkVMType.PVM:
        return activeAccount?.addressPVM.split('-')[1] ?? ''
      case NetworkVMType.EVM:
      default:
        return activeAccount?.addressC ?? ''
    }
  }, [activeAccount, selectedNetwork])

  const refreshSelectedNetwork = useCallback(() => {
    if (selectedNetwork.isTestnet && !isDeveloperMode) {
      const foundNetwork = networks.find(
        network =>
          network.vmName === selectedNetwork.vmName && !network.isTestnet
      )

      if (foundNetwork) {
        setSelectedNetwork(foundNetwork)
      }
    } else if (!selectedNetwork.isTestnet && isDeveloperMode) {
      const foundNetwork = networks.find(
        network =>
          network.vmName === selectedNetwork.vmName && network.isTestnet
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
      // @ts-ignore TODO: make routes typesafe
      pathname: '/selectReceiveNetwork'
    })
  }, [])

  const renderFooter = useCallback(() => {
    return <AccountAddresses address={address} />
  }, [address])

  return (
    <ScrollScreen
      title="Receive crypto"
      subtitle="To receive funds you can choose to share your unique QR code or address below with the sender"
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{
        flex: 1,
        padding: 16,
        paddingTop: 0
      }}>
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
              symbol={selectedNetwork.networkToken?.symbol ?? 'AVAX'}
              size={20}
            />
            <Text
              variant="buttonMedium"
              testID={`receive_selected_network__${selectedNetwork.chainName}`}>
              {selectedNetwork.chainName}
            </Text>
            <Icons.Navigation.ChevronRight
              testID="select_receive_network"
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
          token={selectedNetwork.networkToken?.symbol ?? 'AVAX'}
          label={selectedNetwork.chainName}
        />
        <View
          style={{
            flex: 0.5
          }}
        />
      </View>
    </ScrollScreen>
  )
}
