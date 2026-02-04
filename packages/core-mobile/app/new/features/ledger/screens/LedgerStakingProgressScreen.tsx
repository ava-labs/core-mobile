import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Platform } from 'react-native'
import { Button, useTheme, Icons, ActivityIndicator } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ProgressDots } from 'common/components/ProgressDots'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { Operation } from 'services/earn/computeDelegationSteps/types'
import {
  ledgerStakingProgressCache,
  LedgerStakingProgressParams
} from '../services/ledgerStakingProgressCache'
import { withLedgerStakingProgressCache } from '../services/withLedgerStakingProgressCache'

interface StepConfig {
  title: string
  subtitle: string
}

const getStepConfig = (operation: Operation | null): StepConfig => {
  switch (operation) {
    // Staking operations (C → P direction)
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
    // Claim operations (P → C direction)
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
        subtitle: 'Please wait while we prepare your transaction'
      }
  }
}

const LedgerStakingProgressScreen = ({
  params
}: {
  params: LedgerStakingProgressParams
}): JSX.Element => {
  const { back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const headerHeight = useHeaderHeight()

  const [currentStep, setCurrentStep] = useState(0)
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(
    null
  )
  const [isCancelEnabled, setIsCancelEnabled] = useState(false)

  const { totalSteps, onComplete, onCancel } = params

  // Poll for progress state updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      try {
        const state = ledgerStakingProgressCache.state.get()
        if (state) {
          setCurrentStep(state.currentStep)
          setCurrentOperation(state.currentOperation)

          // Auto-dismiss when all steps complete
          if (state.currentStep >= totalSteps) {
            setTimeout(() => {
              onComplete()
              back()
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
  }, [totalSteps, onComplete, back])

  // Enable cancel button after 3 seconds to prevent accidental cancellation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCancelEnabled(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleCancel = useCallback(() => {
    onCancel()
    back()
  }, [onCancel, back])

  const stepConfig = useMemo(
    () => getStepConfig(currentOperation),
    [currentOperation]
  )

  const headerCenterOverlay = useMemo(() => {
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
          <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
        </View>
      </View>
    )
  }, [headerHeight, totalSteps, currentStep])

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
    </ScrollScreen>
  )
}

export default withLedgerStakingProgressCache(LedgerStakingProgressScreen)
