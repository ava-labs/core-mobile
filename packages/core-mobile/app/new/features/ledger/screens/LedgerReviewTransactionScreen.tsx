import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerReviewTransactionParams } from '../services/ledgerParamsCache'
import { getLedgerAppName } from '../utils'
import { withLedgerParamsCache } from '../services/withLedgerParamsCache'
import { useLedgerDeviceInfo } from '../hooks/useLedgerDeviceInfo'

const LedgerReviewTransactionScreen = ({
  params: { network, onApprove, onReject }
}: {
  params: LedgerReviewTransactionParams
}): JSX.Element => {
  const approvalTriggeredRef = useRef(false)
  const walletId = useSelector(selectActiveWalletId)
  const { deviceId: cachedDeviceId, deviceName: cachedDeviceName } =
    useLedgerDeviceInfo(walletId)
  const [isConnected, setIsConnected] = useState(false)
  const [isCancelEnabled, setIsCancelEnabled] = useState(false)
  const {
    theme: { colors }
  } = useTheme()

  const ledgerAppName = useMemo(() => getLedgerAppName(network), [network])

  const { isConnecting } = useLedgerSetupContext()

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
    if (!cachedDeviceId) return
    handleReconnect(cachedDeviceId)
  }, [cachedDeviceId, handleReconnect])

  useEffect(() => {
    if (approvalTriggeredRef.current) return

    const handleApproveTransaction = async (): Promise<void> => {
      if (cachedDeviceId && isConnected) {
        try {
          approvalTriggeredRef.current = true
          await LedgerService.openApp(ledgerAppName)
          await onApprove()
        } finally {
          approvalTriggeredRef.current = false
        }
      }
    }
    handleApproveTransaction()
  }, [cachedDeviceId, onApprove, isConnected, ledgerAppName])

  useEffect(() => {
    if (isConnected && isCancelEnabled === false) {
      setIsCancelEnabled(true)
    }
  }, [isCancelEnabled, isConnected])

  // Enable cancel button after 3 seconds to prevent ledger triggers transaction signing prompt
  // after user cancels, since it takes a few seconds for ledger to prompt the transaction signing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCancelEnabled(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="secondary"
        size="large"
        onPress={onReject}
        disabled={!isCancelEnabled}>
        Cancel
      </Button>
    )
  }, [onReject, isCancelEnabled])

  const renderDeviceItem = useCallback(() => {
    if (cachedDeviceId) {
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
                  {cachedDeviceName}
                </Text>
              </View>
              <Text
                variant="caption"
                sx={{
                  fontSize: 13,
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
                  onPress={() => handleReconnect(cachedDeviceId)}
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
    cachedDeviceId,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    colors.$textSecondary,
    cachedDeviceName,
    isConnected,
    isConnecting,
    handleReconnect
  ])

  const title = useMemo(() => {
    if (cachedDeviceId) {
      return `Please review the transaction on your ${cachedDeviceName}`
    }
    return 'Get your Ledger ready'
  }, [cachedDeviceId, cachedDeviceName])
  const subtitle = useMemo(() => {
    if (cachedDeviceId) {
      return `Open the ${ledgerAppName} app on your Ledger device in order to continue with this transaction`
    }
    return 'Make sure your Ledger device is unlocked and the Avalanche app is open'
  }, [cachedDeviceId, ledgerAppName])

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16,
        flex: 1,
        flexDirection: 'column'
      }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AnimatedIconWithText
          icon={
            cachedDeviceId ? (
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
          subtitleStyle={{ fontSize: 12 }}
          showAnimation={true}
        />
      </View>
      <View style={{ alignItems: 'flex-end' }}>{renderDeviceItem()}</View>
    </ScrollScreen>
  )
}

export default withLedgerParamsCache('ledgerReviewTransactionParams')(
  LedgerReviewTransactionScreen
)
