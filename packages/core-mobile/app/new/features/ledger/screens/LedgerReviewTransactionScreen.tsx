import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Text,
  Button,
  useTheme,
  Icons,
  View,
  showAlert
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { ChainId, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType } from 'services/ledger/types'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerReviewTransactionParams } from '../../../../services/walletconnectv2/walletConnectCache/types'
import { useLedgerWalletMap } from '../store'

const LedgerReviewTransactionScreen = ({
  params: { network, onApprove, onReject }
}: {
  params: LedgerReviewTransactionParams
}): JSX.Element => {
  const walletId = useSelector(selectActiveWalletId)
  const { ledgerWalletMap } = useLedgerWalletMap()
  const [isConnected, setIsConnected] = useState(false)

  const { back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const ledgerAppName =
    network.chainId === ChainId.AVALANCHE_MAINNET_ID ||
    network.chainId === ChainId.AVALANCHE_TESTNET_ID ||
    network.vmName === NetworkVMType.AVM ||
    network.vmName === NetworkVMType.PVM
      ? LedgerAppType.AVALANCHE
      : network.vmName === NetworkVMType.EVM
      ? LedgerAppType.ETHEREUM
      : network.vmName === NetworkVMType.BITCOIN
      ? LedgerAppType.BITCOIN
      : network.vmName === NetworkVMType.SVM
      ? LedgerAppType.SOLANA
      : LedgerAppType.UNKNOWN

  const { devices, isScanning, isCreatingWallet, isConnecting } =
    useLedgerSetupContext()

  const deviceForWallet = useMemo(() => {
    if (!walletId) return undefined
    return ledgerWalletMap[walletId]
  }, [ledgerWalletMap, walletId])

  const handleReconnect = useCallback(
    async (deviceId: string): Promise<void> => {
      try {
        await LedgerService.ensureConnection(deviceId)
        setIsConnected(true)
      } catch (error) {
        setIsConnected(false)
        showAlert({
          title: 'Ledger disconnected',
          description: 'Reconnect your Ledger device to continue',
          buttons: [{ text: 'Got it', style: 'destructive' }]
        })
      }
    },
    []
  )

  useEffect(() => {
    if (!deviceForWallet) return
    handleReconnect(deviceForWallet.deviceId)
  }, [deviceForWallet, handleReconnect])

  useEffect(() => {
    if (deviceForWallet && isConnected) {
      onApprove()
    }
  }, [
    deviceForWallet,
    onApprove,
    isConnecting,
    isScanning,
    isCreatingWallet,
    isConnected
  ])

  const handleCancel = useCallback(() => {
    onReject()
    back()
  }, [onReject, back])

  const renderFooter = useCallback(() => {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        {isScanning && devices.length === 0 && (
          <View
            style={{
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 12
            }}>
            <ActivityIndicator size="small" color={colors.$textPrimary} />
          </View>
        )}

        <Button type="secondary" size="large" onPress={handleCancel}>
          Cancel
        </Button>
      </View>
    )
  }, [isScanning, devices.length, colors.$textPrimary, handleCancel])

  const renderDeviceItem = useCallback(() => {
    if (deviceForWallet) {
      return (
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.$surfaceSecondary,
            gap: 16,
            borderRadius: 12,
            paddingHorizontal: 16
          }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.$surfaceSecondary,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Icons.Custom.Bluetooth
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          </View>
          <View
            sx={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
            <View sx={{ marginVertical: 14 }}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                <Text
                  numberOfLines={2}
                  variant="buttonMedium"
                  sx={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 16,
                    color: '$textPrimary'
                  }}>
                  {deviceForWallet.deviceName}
                </Text>
              </View>
              <Text
                variant="caption"
                sx={{
                  fontSize: 12,
                  paddingTop: 4,
                  color: colors.$textSecondary
                }}>
                Connected over Bluetooth
              </Text>
            </View>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                flex: 1,
                justifyContent: 'flex-end'
              }}>
              {!isConnected && (
                <Button
                  type="primary"
                  size="small"
                  onPress={() => handleReconnect(deviceForWallet.deviceId)}
                  disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </View>
          </View>
        </View>
      )
    }
    return null
  }, [
    deviceForWallet,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    colors.$textSecondary,
    isConnected,
    isConnecting,
    handleReconnect
  ])

  const title = useMemo(() => {
    if (deviceForWallet) {
      return `Please review the transaction on your ${deviceForWallet.deviceName}`
    }
    return isScanning ? 'Looking for devices...' : 'Get your Ledger ready'
  }, [deviceForWallet, isScanning])

  const subtitle = useMemo(() => {
    if (deviceForWallet) {
      return `Open the ${ledgerAppName} app on your Ledger device in order to continue with this transaction`
    }
    return 'Make sure your Ledger device is unlocked and the Avalanche app is open'
  }, [deviceForWallet, ledgerAppName])

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <AnimatedIconWithText
        icon={
          deviceForWallet ? (
            <Icons.Custom.Bluetooth
              color={colors.$textPrimary}
              width={44}
              height={44}
            />
          ) : (
            <Icons.Custom.Ledger
              color={colors.$textPrimary}
              width={44}
              height={44}
            />
          )
        }
        title={title}
        subtitle={subtitle}
        showAnimation={true}
      />
      {renderDeviceItem()}
    </ScrollScreen>
  )
}

export default withWalletConnectCache('ledgerReviewTransactionParams')(
  LedgerReviewTransactionScreen
)
