import {
  ActivityIndicator,
  Button,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { OnDelegationProgress } from 'contexts/DelegationContext'
import { AnimatedIconWithText } from 'features/ledger/components/AnimatedIconWithText'
import { useLedgerBLEConnection } from 'features/ledger/hooks/useLedgerBLEConnection'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Operation } from 'services/earn/computeDelegationSteps/types'

type LedgerPhase = 'idle' | 'connecting' | 'progress'

type UseLedgerStakingReturn = {
  startLedgerDelegation: (
    action: (onProgress?: OnDelegationProgress) => void | Promise<void>
  ) => void
  resetLedgerState: () => void
  renderLedgerFooter: (totalSteps: number) => JSX.Element | null
}

export const useLedgerStaking = (isLedger: boolean): UseLedgerStakingReturn => {
  const { theme } = useTheme()
  const [ledgerPhase, setLedgerPhase] = useState<LedgerPhase>('idle')
  const [ledgerCurrentStep, setLedgerCurrentStep] = useState(0)
  const [ledgerCurrentOperation, setLedgerCurrentOperation] =
    useState<Operation | null>(null)
  const [approvalInProgress, setApprovalInProgress] = useState(false)
  const pendingActionRef = useRef<
    ((onProgress?: OnDelegationProgress) => void | Promise<void>) | undefined
  >(undefined)

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const {
    isLedgerConnected,
    isAvalancheAppOpen,
    deviceForWallet,
    handleReconnect,
    connectionStatus
  } = useLedgerBLEConnection({
    isLedger,
    isConnecting: ledgerPhase === 'connecting'
  })

  // Start delegation once device is connected and Avalanche app is open
  useEffect(() => {
    if (
      !isLedger ||
      ledgerPhase !== 'connecting' ||
      !isLedgerConnected ||
      !isAvalancheAppOpen ||
      approvalInProgress
    )
      return

    setApprovalInProgress(true)
    setLedgerPhase('progress')

    const onProgress: OnDelegationProgress = (
      step: number,
      operation: Operation | null
    ): void => {
      if (operation === null) {
        return
      }
      setLedgerCurrentStep(step + 1) // Convert to 1-based index for user display
      setLedgerCurrentOperation(operation)
    }

    const resetOnFailure = (): void => {
      if (!isMountedRef.current) {
        return
      }
      setApprovalInProgress(false)
      setLedgerPhase('connecting')
    }

    try {
      const result = pendingActionRef.current?.(onProgress)
      if (result instanceof Promise) {
        result.catch(resetOnFailure)
      }
    } catch {
      resetOnFailure()
    }
  }, [
    ledgerPhase,
    isLedgerConnected,
    isAvalancheAppOpen,
    approvalInProgress,
    isLedger
  ])

  const startLedgerDelegation = useCallback(
    (
      action: (onProgress?: OnDelegationProgress) => void | Promise<void>
    ): void => {
      pendingActionRef.current = action
      setLedgerPhase('connecting')
      setLedgerCurrentStep(0)
      setLedgerCurrentOperation(null)
      setApprovalInProgress(false)
    },
    []
  )

  const resetLedgerState = useCallback((): void => {
    setLedgerPhase('idle')
    setApprovalInProgress(false)
    pendingActionRef.current = undefined
  }, [])

  const stepConfig = useMemo(() => {
    switch (ledgerCurrentOperation) {
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
  }, [ledgerCurrentOperation])

  const renderLedgerFooter = useCallback(
    (totalSteps: number): JSX.Element | null => {
      if (!isLedger) return null

      if (ledgerPhase === 'connecting') {
        return (
          <View sx={{ gap: 16, marginTop: 24 }}>
            {deviceForWallet && (
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.$surfaceSecondary,
                  gap: 16,
                  borderRadius: 12,
                  paddingHorizontal: 16
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.colors.$surfaceSecondary,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <Icons.Custom.Bluetooth
                    color={theme.colors.$textPrimary}
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
                  <View sx={{ marginVertical: 14, flex: 1, flexShrink: 1 }}>
                    <Text
                      numberOfLines={1}
                      variant="buttonMedium"
                      sx={{
                        fontFamily: 'Inter-Medium',
                        fontSize: 16,
                        color: '$textPrimary'
                      }}>
                      {deviceForWallet.name}
                    </Text>
                    <Text
                      numberOfLines={2}
                      variant="caption"
                      sx={{
                        fontSize: 13,
                        paddingTop: 4,
                        color: theme.colors.$textSecondary
                      }}>
                      {connectionStatus}
                    </Text>
                  </View>
                  <View
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0
                    }}>
                    {!isLedgerConnected && (
                      <Button
                        type="secondary"
                        size="small"
                        style={{ width: 72 }}
                        onPress={handleReconnect}>
                        {ledgerPhase === 'connecting' ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.colors.$surfacePrimary}
                          />
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            )}
            <Button type="tertiary" size="large" onPress={resetLedgerState}>
              Cancel
            </Button>
          </View>
        )
      }

      if (ledgerPhase === 'progress') {
        const title = stepConfig.title.includes('Preparing')
          ? stepConfig.title
          : `${stepConfig.title} [${ledgerCurrentStep}/${totalSteps}]`
        return (
          <AnimatedIconWithText
            icon={
              <Icons.Custom.Ledger
                color={theme.colors.$textPrimary}
                width={32}
                height={32}
              />
            }
            space={16}
            style={{ marginTop: 24 }}
            animationSize={{ width: 120, height: 120 }}
            title={title}
            titleStyle={{ fontSize: 16 }}
            subtitle={stepConfig.subtitle}
            subtitleStyle={{ fontSize: 12 }}
            showAnimation
          />
        )
      }

      return null
    },
    [
      isLedger,
      ledgerPhase,
      deviceForWallet,
      theme.colors.$surfaceSecondary,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary,
      theme.colors.$surfacePrimary,
      connectionStatus,
      isLedgerConnected,
      handleReconnect,
      stepConfig.title,
      stepConfig.subtitle,
      ledgerCurrentStep,
      resetLedgerState
    ]
  )

  return {
    startLedgerDelegation,
    resetLedgerState,
    renderLedgerFooter
  }
}
