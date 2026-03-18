import { OnDelegationProgress } from 'contexts/DelegationContext'
import {
  getStepConfig,
  LedgerReviewFooter
} from 'features/ledger/components/LedgerReviewFooter'
import { useLedgerBLEConnection } from 'features/ledger/hooks/useLedgerBLEConnection'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Operation } from 'services/earn/computeDelegationSteps/types'
import LedgerService from 'services/ledger/LedgerService'

type LedgerPhase = 'idle' | 'connecting' | 'progress'

type UseLedgerClaimRewardReturn = {
  startLedgerClaimReward: (
    action: (onProgress?: OnDelegationProgress) => void | Promise<void>
  ) => void
  resetLedgerState: () => void
  renderLedgerFooter: (totalSteps: number) => JSX.Element | null
}

export const useLedgerClaimReward = (
  isLedger: boolean,
  onCancel?: () => void
): UseLedgerClaimRewardReturn => {
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
    isReconnecting,
    deviceForWallet,
    handleReconnect,
    connectionStatus
  } = useLedgerBLEConnection({
    isLedger,
    isConnecting: ledgerPhase === 'connecting'
  })

  // Start claim once device is connected and Avalanche app is open
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

  const startLedgerClaimReward = useCallback(
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

  const cancelLedger = useCallback((): void => {
    resetLedgerState()
    LedgerService.disconnect()
    onCancel?.()
  }, [resetLedgerState, onCancel])

  const stepConfig = useMemo(
    () => getStepConfig(ledgerCurrentOperation),
    [ledgerCurrentOperation]
  )

  const renderLedgerFooter = useCallback(
    (totalSteps: number): JSX.Element | null => {
      if (!isLedger || ledgerPhase === 'idle') return null

      return (
        <LedgerReviewFooter
          ledgerPhase={ledgerPhase}
          deviceForWallet={deviceForWallet}
          connectionStatus={connectionStatus}
          isLedgerConnected={isLedgerConnected}
          isReconnecting={isReconnecting}
          handleReconnect={handleReconnect}
          onCancel={cancelLedger}
          stepTitle={stepConfig.title}
          stepSubtitle={stepConfig.subtitle}
          ledgerCurrentStep={ledgerCurrentStep}
          totalSteps={totalSteps}
        />
      )
    },
    [
      isLedger,
      ledgerPhase,
      deviceForWallet,
      connectionStatus,
      isLedgerConnected,
      isReconnecting,
      handleReconnect,
      cancelLedger,
      stepConfig.title,
      stepConfig.subtitle,
      ledgerCurrentStep
    ]
  )

  return {
    startLedgerClaimReward,
    resetLedgerState,
    renderLedgerFooter
  }
}
