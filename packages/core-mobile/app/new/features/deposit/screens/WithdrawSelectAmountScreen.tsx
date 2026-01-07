import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { useDeposits } from 'hooks/earn/useDeposits'
import { MarketNames } from '../types'
import { WithdrawBenqiSelectAmountForm } from '../components/WithdrawBenqiSelectAmountForm'
import { WithdrawAaveSelectAmountForm } from '../components/WithdrawAaveSelectAmountForm'

export const SelectAmountScreen = (): JSX.Element => {
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { deposits } = useDeposits()
  const deposit = useMemo(() => {
    return deposits.find(item => item.uniqueMarketId === marketId)
  }, [deposits, marketId])
  const { dismissAll } = useRouter()

  const handleSuccess = useCallback(() => {
    dismissAll()
  }, [dismissAll])

  if (!deposit) {
    return <></>
  }

  if (deposit.marketName === MarketNames.aave) {
    return (
      <WithdrawAaveSelectAmountForm
        market={deposit}
        onSuccess={handleSuccess}
      />
    )
  } else if (deposit.marketName === MarketNames.benqi) {
    return (
      <WithdrawBenqiSelectAmountForm
        market={deposit}
        onSuccess={handleSuccess}
      />
    )
  }

  return <></>
}
