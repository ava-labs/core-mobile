import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useDeposits } from 'hooks/earn/useDeposits'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { MarketNames } from '../../types'
import { WithdrawBenqiSelectAmountForm } from '../../components/withdraw/BenqiSelectAmountForm'
import { WithdrawAaveSelectAmountForm } from '../../components/withdraw/AaveSelectAmountForm'

export const SelectAmountScreen = (): JSX.Element => {
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { deposits } = useDeposits()
  const activeAccount = useSelector(selectActiveAccount)
  const deposit = useMemo(() => {
    return deposits.find(item => item.uniqueMarketId === marketId)
  }, [deposits, marketId])
  const { dismissAll } = useRouter()

  const handleSubmitted = useCallback(
    ({ txHash, amount }: { txHash: string; amount: TokenUnit }) => {
      AnalyticsService.capture('EarnWithdrawSubmitted', {
        token: deposit?.asset.symbol ?? '',
        quantity: amount.toDisplay(),
        protocol: deposit?.marketName ?? '',
        txHash,
        address: activeAccount?.addressC ?? ''
      })
      dismissAll()
    },
    [deposit, activeAccount, dismissAll]
  )

  // Called when transaction is confirmed on-chain
  const handleConfirmed = useCallback(() => {
    AnalyticsService.capture('EarnWithdrawSuccess')
  }, [])

  // Wallet/form errors. Param is optional because the form prop is typed `() => void`,
  // but the underlying useETHSendTransaction invokes onError(error) at runtime.
  const handleError = useCallback((error?: unknown) => {
    AnalyticsService.capture('EarnWithdrawFailure', {
      errorMessage:
        error instanceof Error ? error.message : 'Transaction failed'
    })
  }, [])

  // Called when the on-chain receipt reports status 0. useETHSendTransaction
  // passes a requestId (string) we intentionally ignore so it doesn't pollute analytics.
  const handleReverted = useCallback(() => {
    AnalyticsService.capture('EarnWithdrawFailure', {
      errorMessage: 'Transaction reverted on-chain'
    })
  }, [])

  if (!deposit) {
    return <></>
  }

  if (deposit.marketName === MarketNames.aave) {
    return (
      <WithdrawAaveSelectAmountForm
        market={deposit}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleReverted}
        onError={handleError}
      />
    )
  } else if (deposit.marketName === MarketNames.benqi) {
    return (
      <WithdrawBenqiSelectAmountForm
        market={deposit}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleReverted}
        onError={handleError}
      />
    )
  }

  return <></>
}
