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
  const router = useRouter()
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
      if (router.canDismiss()) {
        router.dismiss()
      } else if (router.canGoBack()) {
        router.back()
      }
    },
    [router, protocol, activeAccount]
  )

  const handleConfirmed = useCallback(() => {
    AnalyticsService.capture('EarnRepaySuccess')
  }, [])

  const handleError = useCallback(() => {
    AnalyticsService.capture('EarnRepayFailure')
  }, [])

  if (protocol === MarketNames.aave) {
    return (
      <AaveRepaySelectAmountForm
        marketId={marketId ?? ''}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
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
        onReverted={handleError}
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
