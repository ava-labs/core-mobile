import {
  LedgerReviewFooter,
  LedgerReviewPhase
} from 'features/ledger/components/LedgerReviewFooter'
import { useLedgerBLEConnection } from 'features/ledger/hooks/useLedgerBLEConnection'
import { ledgerParamsStore, useLedgerParams } from 'features/ledger/store'
import { getLedgerAppName } from 'features/ledger/utils'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LedgerService from 'services/ledger/LedgerService'
import { TRANSACTION_CANCELLED_BY_USER } from 'vmModule/ApprovalController/utils'

type UseLedgerApprovalReturn = {
  renderLedgerFooter: () => JSX.Element | null
}

export const useLedgerApproval = (
  isLedger: boolean
): UseLedgerApprovalReturn => {
  const [ledgerPhase, setLedgerPhase] = useState<LedgerReviewPhase>(
    LedgerReviewPhase.IDLE
  )
  const [approvalInProgress, setApprovalInProgress] = useState(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const { reviewTransactionParams } = useLedgerParams()
  const prevParamsRef = useRef(reviewTransactionParams)

  const appType = useMemo(
    () => getLedgerAppName(reviewTransactionParams?.network),
    [reviewTransactionParams?.network]
  )

  const {
    isLedgerConnected,
    isAvalancheAppOpen: isRequiredAppOpen,
    isReconnecting,
    deviceForWallet,
    handleReconnect,
    connectionStatus
  } = useLedgerBLEConnection({
    isLedger,
    isConnecting: ledgerPhase === 'connecting',
    appType
  })

  // Transition to connecting when new params arrive
  useEffect(() => {
    if (!isLedger || !reviewTransactionParams) return
    if (reviewTransactionParams === prevParamsRef.current) return
    prevParamsRef.current = reviewTransactionParams
    setLedgerPhase(LedgerReviewPhase.CONNECTING)
    setApprovalInProgress(false)
  }, [reviewTransactionParams, isLedger])

  // Execute signing once device is connected and correct app is open
  useEffect(() => {
    if (
      !isLedger ||
      ledgerPhase !== 'connecting' ||
      !isLedgerConnected ||
      !isRequiredAppOpen ||
      approvalInProgress
    )
      return

    setApprovalInProgress(true)
    setLedgerPhase(LedgerReviewPhase.PROGRESS)

    const resetOnFailure = (): void => {
      if (!isMountedRef.current) return
      setApprovalInProgress(false)
      setLedgerPhase(LedgerReviewPhase.CONNECTING)
    }

    try {
      const result = reviewTransactionParams?.onApprove()
      if (result instanceof Promise) {
        result.catch(resetOnFailure)
      }
    } catch {
      resetOnFailure()
    }
  }, [
    ledgerPhase,
    isLedgerConnected,
    isRequiredAppOpen,
    approvalInProgress,
    isLedger,
    reviewTransactionParams
  ])

  const resetLedgerState = useCallback((): void => {
    setLedgerPhase(LedgerReviewPhase.IDLE)
    setApprovalInProgress(false)
  }, [])

  const cancelLedger = useCallback((): void => {
    resetLedgerState()
    reviewTransactionParams?.onReject(TRANSACTION_CANCELLED_BY_USER)
    ledgerParamsStore.getState().setReviewTransactionParams(null)
    LedgerService.disconnect()
  }, [resetLedgerState, reviewTransactionParams])

  const renderLedgerFooter = useCallback((): JSX.Element | null => {
    if (!isLedger || ledgerPhase === LedgerReviewPhase.IDLE) return null

    return (
      <LedgerReviewFooter
        ledgerPhase={ledgerPhase as LedgerReviewPhase}
        deviceForWallet={deviceForWallet}
        connectionStatus={connectionStatus}
        isLedgerConnected={isLedgerConnected}
        isReconnecting={isReconnecting}
        handleReconnect={handleReconnect}
        onCancel={cancelLedger}
        stepTitle="Review Transaction"
        stepSubtitle="Sign the transaction on your Ledger device"
        ledgerCurrentStep={1}
        totalSteps={1}
      />
    )
  }, [
    isLedger,
    ledgerPhase,
    deviceForWallet,
    connectionStatus,
    isLedgerConnected,
    isReconnecting,
    handleReconnect,
    cancelLedger
  ])

  return { renderLedgerFooter }
}
