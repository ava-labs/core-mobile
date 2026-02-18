import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import {
  useTheme,
  Icons,
  View,
  showAlert,
  ActivityIndicator
} from '@avalabs/k2-alpine'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'
import { ProgressDots } from 'common/components/ProgressDots'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import { LedgerAppType } from 'services/ledger/types'
import Logger from 'utils/Logger'
import { useHeaderHeight } from '@react-navigation/elements'
import { Operation } from 'services/earn/computeDelegationSteps/types'
import { LEDGER_DEVICE_BRIEF_DELAY_MS } from '../consts'
import { useLedgerWalletMap, useLedgerParams } from '../store'
import { LedgerReviewScreen } from './LedgerReviewScreen'

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
    case Operation.EXPORT_P:
      return {
        title: 'Export from P-Chain',
        subtitle: 'Sign the export transaction on your Ledger device'
      }
    case Operation.IMPORT_C:
      return {
        title: 'Import to C-Chain',
        subtitle: 'Sign the import transaction on your Ledger device'
      }
    default:
      return {
        title: 'Preparing transaction...',
        subtitle: 'Please wait while we prepare your staking transaction'
      }
  }
}

export const LedgerReviewStakingScreen = (): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const walletId = useSelector(selectActiveWalletId)
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()
  const { reviewTransactionParams } = useLedgerParams()

  // Extract params from store
  const { onApprove, onReject, stakingProgress } = reviewTransactionParams || {}
  const [isConnected, setIsConnected] = useState(false)
  const [isAvalancheAppOpen, setIsAvalancheAppOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('connection')
  const [currentStep, setCurrentStep] = useState(0)
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(
    null
  )
  const headerHeight = useHeaderHeight()

  const deviceForWallet = useMemo(
    () => getLedgerInfoByWalletId(walletId)?.device,
    [getLedgerInfoByWalletId, walletId]
  )

  // Handle connection established - require BOTH connection AND Avalanche app open
  useEffect(() => {
    if (
      stakingProgress &&
      deviceForWallet &&
      isConnected &&
      isAvalancheAppOpen &&
      phase === 'connection'
    ) {
      try {
        // Create progress callback that updates local state
        const onProgress = (
          step: number,
          operation: Operation | null
        ): void => {
          setCurrentStep(step)
          setCurrentOperation(operation)

          // Auto-complete when all steps are done
          if (step >= stakingProgress.totalSteps) {
            setTimeout(() => {
              stakingProgress.onComplete()
            }, LEDGER_DEVICE_BRIEF_DELAY_MS) // Brief delay to show final state
          }
        }
        // Transition to progress phase
        setPhase('progress')
        // Start the transaction process with progress callback
        onApprove?.(onProgress)
      } catch (error) {
        Logger.error('Error during Ledger transaction approval', error)
        showAlert({
          title: 'Transaction failed',
          description:
            'Something went wrong while communicating with your Ledger device. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }]
        })
        // Reset phase and local progress state so the user can retry or cancel
        setPhase('connection')
        setCurrentStep(0)
        setCurrentOperation(null)
      }
    }
  }, [
    isConnected,
    isAvalancheAppOpen,
    phase,
    stakingProgress,
    onApprove,
    deviceForWallet
  ])

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
  const renderStakingInProgressContent = useCallback(() => {
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
  }, [colors.$textPrimary, stepConfig])

  return (
    <LedgerReviewScreen
      isConnected={isConnected}
      setIsConnected={setIsConnected}
      isAppOpened={isAvalancheAppOpen}
      setIsAppOpened={setIsAvalancheAppOpen}
      deviceForWallet={deviceForWallet}
      isWaitingForConnection={phase === 'connection'}
      appType={LedgerAppType.AVALANCHE}
      renderContent={
        phase === 'progress' && stakingProgress
          ? renderStakingInProgressContent
          : undefined
      }
      headerCenterOverlay={headerCenterOverlay}
      onReject={onReject}
    />
  )
}
