import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import {
  Text,
  Button,
  useTheme,
  Icons,
  View,
  showAlert,
  ActivityIndicator
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'
import { ProgressDots } from 'common/components/ProgressDots'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import LedgerService from 'services/ledger/LedgerService'
import { useHeaderHeight } from '@react-navigation/elements'
import { Operation } from 'services/earn/computeDelegationSteps/types'
import { LedgerReviewTransactionParams } from '../services/ledgerParamsCache'
import { ledgerStakingProgressCache } from '../services/ledgerStakingProgressCache'
import { useLedgerWalletMap } from '../store'
import { getLedgerAppName } from '../utils'
import { withLedgerParamsCache } from '../services/withLedgerParamsCache'

type Phase = 'connection' | 'progress'

interface StepConfig {
  title: string
  subtitle: string
}

const getStepConfig = (operation: Operation | null): StepConfig => {
  switch (operation) {
    case Operation.EXPORT_C:
      return {
        title: 'Export from C-Chain',
        subtitle: 'Sign the export transaction on your Ledger device'
      }
    case Operation.IMPORT_P:
      return {
        title: 'Import to P-Chain',
        subtitle: 'Sign the import transaction on your Ledger device'
      }
    case Operation.DELEGATE:
      return {
        title: 'Delegate Stake',
        subtitle: 'Sign the delegation transaction on your Ledger device'
      }
    default:
      return {
        title: 'Preparing transaction...',
        subtitle: 'Please wait while we prepare your staking transaction'
      }
  }
}

const LedgerReviewTransactionScreen = ({
  params: { network, onApprove, onReject, stakingProgress }
}: {
  params: LedgerReviewTransactionParams
}): JSX.Element => {
  const walletId = useSelector(selectActiveWalletId)
  const { ledgerWalletMap } = useLedgerWalletMap()
  const [isConnected, setIsConnected] = useState(false)
  const [isCancelEnabled, setIsCancelEnabled] = useState(false)
  const [phase, setPhase] = useState<Phase>('connection')
  const [currentStep, setCurrentStep] = useState(0)
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(
    null
  )
  const {
    theme: { colors }
  } = useTheme()
  const headerHeight = useHeaderHeight()

  const ledgerAppName = useMemo(() => getLedgerAppName(network), [network])

  const { isConnecting } = useLedgerSetupContext()

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

  // Handle connection established - either transition to progress phase or call onApprove directly
  useEffect(() => {
    if (deviceForWallet && isConnected && phase === 'connection') {
      if (stakingProgress) {
        // Initialize progress state for staking
        ledgerStakingProgressCache.state.set({
          currentStep: 0,
          currentOperation: null
        })
        // Transition to progress phase
        setPhase('progress')
        // Start the transaction process
        onApprove()
      } else {
        // No staking progress tracking, just approve and let the caller handle navigation
        onApprove()
      }
    }
  }, [deviceForWallet, isConnected, phase, stakingProgress, onApprove])

  // Poll for progress state updates when in progress phase
  useEffect(() => {
    if (phase !== 'progress' || !stakingProgress) return

    const pollInterval = setInterval(() => {
      try {
        const state = ledgerStakingProgressCache.state.get()
        if (state) {
          setCurrentStep(state.currentStep)
          setCurrentOperation(state.currentOperation)

          // Auto-complete when all steps are done
          if (state.currentStep >= stakingProgress.totalSteps) {
            setTimeout(() => {
              stakingProgress.onComplete()
            }, 500) // Brief delay to show final state
          }

          // Re-set the state so it's available for next poll
          ledgerStakingProgressCache.state.set(state)
        }
      } catch (error) {
        // State not available yet, will retry on next poll
      }
    }, 200) // Poll every 200ms

    return () => clearInterval(pollInterval)
  }, [phase, stakingProgress])

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

  const handleCancel = useCallback(() => {
    if (phase === 'progress' && stakingProgress) {
      stakingProgress.onCancel()
    }
    onReject()
  }, [phase, stakingProgress, onReject])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="secondary"
        size="large"
        onPress={handleCancel}
        disabled={!isCancelEnabled}>
        Cancel
      </Button>
    )
  }, [handleCancel, isCancelEnabled])

  const renderDeviceItem = useCallback(() => {
    if (deviceForWallet && phase === 'connection') {
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
    phase,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    colors.$textSecondary,
    isConnected,
    isConnecting,
    handleReconnect
  ])

  const connectionTitle = useMemo(() => {
    if (deviceForWallet) {
      return `Please review the transaction on your ${deviceForWallet.deviceName}`
    }
    return 'Get your Ledger ready'
  }, [deviceForWallet])

  const connectionSubtitle = useMemo(() => {
    if (deviceForWallet) {
      return `Open the ${ledgerAppName} app on your Ledger device in order to continue with this transaction`
    }
    return 'Make sure your Ledger device is unlocked and the Avalanche app is open'
  }, [deviceForWallet, ledgerAppName])

  const stepConfig = useMemo(
    () => getStepConfig(currentOperation),
    [currentOperation]
  )

  const headerCenterOverlay = useMemo(() => {
    if (phase !== 'progress' || !stakingProgress) return undefined

    const paddingTop = Platform.OS === 'ios' ? 15 : 50

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop
          }}>
          <ProgressDots
            totalSteps={stakingProgress.totalSteps}
            currentStep={currentStep}
          />
        </View>
      </View>
    )
  }, [phase, stakingProgress, headerHeight, currentStep])

  // Render content based on current phase
  const renderContent = useCallback(() => {
    if (phase === 'progress' && stakingProgress) {
      return (
        <>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <AnimatedIconWithText
              icon={
                <Icons.Custom.Avalanche
                  color={colors.$textPrimary}
                  width={44}
                  height={44}
                />
              }
              title={stepConfig.title}
              subtitle={stepConfig.subtitle}
              subtitleStyle={{ fontSize: 12 }}
              showAnimation={true}
            />
            <View
              style={{
                marginTop: 32,
                alignItems: 'center'
              }}>
              <ActivityIndicator size="large" color={colors.$textPrimary} />
            </View>
          </View>
        </>
      )
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
    phase,
    stakingProgress,
    colors.$textPrimary,
    stepConfig,
    deviceForWallet,
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

export default withLedgerParamsCache('ledgerReviewTransactionParams')(
  LedgerReviewTransactionScreen
)
