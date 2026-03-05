import React, { useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ErrorState } from 'common/components/ErrorState'
import { MarketNames } from '../../types'
import { AaveRepaySelectAmountForm } from '../../components/repay/AaveRepaySelectAmountForm'
import { BenqiRepaySelectAmountForm } from '../../components/repay/BenqiRepaySelectAmountForm'

export function RepaySelectAmountScreen(): JSX.Element {
  const router = useRouter()
  const { marketId, protocol } = useLocalSearchParams<{
    marketId: string
    protocol: string
  }>()

  const dismiss = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss()
    } else if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  if (protocol === MarketNames.aave) {
    return (
      <AaveRepaySelectAmountForm
        marketId={marketId ?? ''}
        onSubmitted={dismiss}
      />
    )
  }

  if (protocol === MarketNames.benqi) {
    return (
      <BenqiRepaySelectAmountForm
        marketId={marketId ?? ''}
        onSubmitted={dismiss}
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
