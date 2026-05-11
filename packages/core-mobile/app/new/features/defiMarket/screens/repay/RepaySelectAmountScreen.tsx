import React, { useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { ErrorState } from 'common/components/ErrorState'
import { MarketNames } from '../../types'
import { AaveRepaySelectAmountForm } from '../../components/repay/AaveRepaySelectAmountForm'
import { BenqiRepaySelectAmountForm } from '../../components/repay/BenqiRepaySelectAmountForm'

export function RepaySelectAmountScreen(): JSX.Element {
  const { dismissAll } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)
  const { marketId, protocol } = useLocalSearchParams<{
    marketId: string
    protocol: string
  }>()

  const handleSubmitted = useCallback(
    ({ txHash, amount }: { txHash: string; amount: TokenUnit }) => {
      AnalyticsService.capture('EarnRepaySubmitted', {
        token: amount.getSymbol(),
        quantity: amount.toDisplay(),
        protocol: protocol ?? '',
        txHash,
        address: activeAccount?.addressC ?? ''
      })
      dismissAll()
    },
    [dismissAll, protocol, activeAccount]
  )

  const handleConfirmed = useCallback(() => {
    AnalyticsService.capture('EarnRepaySuccess')
  }, [])

  // Wallet/form errors. Param is optional because the form prop is typed `() => void`,
  // but the underlying useETHSendTransaction invokes onError(error) at runtime.
  const handleError = useCallback((error?: unknown) => {
    AnalyticsService.capture('EarnRepayFailure', {
      errorMessage:
        error instanceof Error ? error.message : 'Transaction failed'
    })
  }, [])

  // Called when the on-chain receipt reports status 0. useETHSendTransaction
  // passes a requestId (string) we intentionally ignore so it doesn't pollute analytics.
  const handleReverted = useCallback(() => {
    AnalyticsService.capture('EarnRepayFailure', {
      errorMessage: 'Transaction reverted on-chain'
    })
  }, [])

  if (protocol === MarketNames.aave) {
    return (
      <AaveRepaySelectAmountForm
        marketId={marketId ?? ''}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleReverted}
        onError={handleError}
      />
    )
  }

  if (protocol === MarketNames.benqi) {
    return (
      <BenqiRepaySelectAmountForm
        marketId={marketId ?? ''}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleReverted}
        onError={handleError}
      />
    )
  }

  return (
    <ErrorState
      sx={{ flex: 1 }}
      title="Unknown protocol"
      description="Unable to determine protocol"
    />
  )
}
