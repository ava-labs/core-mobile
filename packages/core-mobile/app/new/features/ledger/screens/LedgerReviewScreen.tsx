import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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
import LedgerService from 'services/ledger/LedgerService'
import { LedgerAppType, LedgerDevice } from 'services/ledger/types'
import Logger from 'utils/Logger'
import { BackHandler } from 'react-native'
import { useNavigation } from 'expo-router'
import { TRANSACTION_CANCELLED_BY_USER } from 'vmModule/ApprovalController/utils'
import { LEDGER_DEVICE_BRIEF_DELAY_MS } from '../consts'

export const LedgerReviewScreen = ({
  isConnected = false,
  setIsConnected,
  isAppOpened = false,
  setIsAppOpened,
  deviceForWallet,
  isWaitingForConnection,
  appType,
  renderContent: _renderContent,
  onReject,
  headerCenterOverlay
}: {
  isConnected: boolean
  setIsConnected: (isConnected: boolean) => void
  isAppOpened: boolean
  setIsAppOpened: (isOpen: boolean) => void
  deviceForWallet?: Omit<LedgerDevice, 'rssi'>
  isWaitingForConnection: boolean
  appType: LedgerAppType
  onReject?: (reason: string) => void
  headerCenterOverlay?: React.ReactNode
  renderContent?: () => JSX.Element
}): JSX.Element | null => {
  const navigation = useNavigation()
  const dismissInProgressRef = useRef(false)
  const {
    theme: { colors }
  } = useTheme()

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
    [setIsConnected]
  )

  useEffect(() => {
    if (!deviceForWallet) return
    handleReconnect(deviceForWallet.id)
  }, [deviceForWallet, handleReconnect])

  // Poll for device connection and app status while in connection phase
  useEffect(() => {
    if (!isWaitingForConnection) return

    const checkDeviceReady = async (): Promise<void> => {
      try {
        // Check if device is connected
        const connected = LedgerService.isConnected()
        setIsConnected(connected)

        if (connected) {
          // Check if correct app is open
          const currentAppType = LedgerService.getCurrentAppType()
          const isCorrectAppOpened = currentAppType === appType
          setIsAppOpened(isCorrectAppOpened)
        } else {
          setIsAppOpened(false)
        }
      } catch (error) {
        Logger.error('Error checking device status', error)
        setIsConnected(false)
        setIsAppOpened(false)
      }
    }

    // Initial check
    checkDeviceReady()

    // Poll every 1000ms
    const pollInterval = setInterval(
      checkDeviceReady,
      LEDGER_DEVICE_BRIEF_DELAY_MS
    )

    return () => clearInterval(pollInterval)
  }, [appType, isWaitingForConnection, setIsAppOpened, setIsConnected])

  // Handle Android hardware back button
  useEffect(() => {
    const onBackPress = (): boolean => {
      if (!dismissInProgressRef.current) {
        dismissInProgressRef.current = true
        if (onReject) {
          onReject(TRANSACTION_CANCELLED_BY_USER)
          return true // Prevent default back behavior, onReject handles navigation
        }
      }
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    )

    return () => backHandler.remove()
  }, [onReject])

  // Handle gesture dismissal (swipe down)
  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (
        e.data.action.type === 'POP' && // gesture dismissed
        !dismissInProgressRef.current &&
        onReject
      ) {
        e.preventDefault()
        dismissInProgressRef.current = true
        // Modal is being dismissed via gesture
        onReject(TRANSACTION_CANCELLED_BY_USER)
      }
    })
  }, [navigation, onReject])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="secondary"
        size="large"
        onPress={() => onReject?.(TRANSACTION_CANCELLED_BY_USER)}>
        Cancel
      </Button>
    )
  }, [onReject])

  const renderDeviceItem = useCallback(() => {
    if (deviceForWallet && isWaitingForConnection) {
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
                  {deviceForWallet.name}
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
                  onPress={() => handleReconnect(deviceForWallet.id)}
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
    isWaitingForConnection,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    colors.$textSecondary,
    isConnected,
    isConnecting,
    handleReconnect
  ])

  const connectionTitle = useMemo(() => {
    if (deviceForWallet) {
      return `Please review the transaction on your ${deviceForWallet.name}`
    }
    return 'Get your Ledger ready'
  }, [deviceForWallet])

  const connectionSubtitle = useMemo(() => {
    if (deviceForWallet) {
      if (isConnected && !isAppOpened) {
        return `Please open the ${appType} app on your Ledger device to continue`
      }
      if (!isConnected) {
        return `Connect your ${deviceForWallet.name} and open the ${appType} app`
      }
      return `Open the ${appType} app on your Ledger device in order to continue with this transaction`
    }
    return `Make sure your Ledger device is unlocked and the ${appType} app is open`
  }, [deviceForWallet, appType, isConnected, isAppOpened])

  // Render content based on current phase
  const renderContent = useCallback(() => {
    if (_renderContent) {
      return _renderContent()
    }

    // Connection phase
    return (
      <>
        <View style={{ flex: 1, justifyContent: 'center' }}>
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
            title={connectionTitle}
            subtitle={connectionSubtitle}
            subtitleStyle={{ fontSize: 12 }}
            showAnimation={true}
          />
        </View>
        <View style={{ alignItems: 'flex-end' }}>{renderDeviceItem()}</View>
      </>
    )
  }, [
    _renderContent,
    deviceForWallet,
    colors.$textPrimary,
    connectionTitle,
    connectionSubtitle,
    renderDeviceItem
  ])

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      headerCenterOverlay={headerCenterOverlay}
      contentContainerStyle={{
        padding: 16,
        flex: 1,
        flexDirection: 'column'
      }}>
      {renderContent()}
    </ScrollScreen>
  )
}
