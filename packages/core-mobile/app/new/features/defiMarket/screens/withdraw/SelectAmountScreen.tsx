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

  // Called when transaction is reverted or fails
  const handleError = useCallback(() => {
    AnalyticsService.capture('EarnWithdrawFailure')
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
        onReverted={handleError}
        onError={handleError}
      />
    )
  } else if (deposit.marketName === MarketNames.benqi) {
    return (
      <WithdrawBenqiSelectAmountForm
        market={deposit}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    )
  }

  return <></>
}
