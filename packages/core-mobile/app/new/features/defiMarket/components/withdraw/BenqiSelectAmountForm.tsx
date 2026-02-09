import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { DefiMarket } from '../../types'
import { useBenqiWithdraw } from '../../hooks/benqi/useBenqiWithdraw'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const WithdrawBenqiSelectAmountForm = ({
  market,
  onSuccess
}: {
  market: DefiMarket
  onSuccess: () => void
}): JSX.Element => {
  const activeAccount = useSelector(selectActiveAccount)
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      market.asset.mintTokenBalance.balance,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [market])

  const { withdraw } = useBenqiWithdraw({ market })

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error('The specified amount exceeds the available balance')
      }
    },
    [tokenBalance]
  )

  const handleFailure = useCallback(() => {
    AnalyticsService.capture('EarnWithdrawFailure')
  }, [])

  const handleSuccess = useCallback(
    ({ txHash, amount }: { txHash: string; amount: TokenUnit }) => {
      AnalyticsService.capture('EarnWithdrawSubmitted', {
        token: market.asset.symbol,
        quantity: amount.toDisplay(),
        protocol: market.marketName,
        txHash,
        address: activeAccount?.addressC ?? ''
      })
      onSuccess()
    },
    [market.asset.symbol, market.marketName, activeAccount?.addressC, onSuccess]
  )

  return (
    <SelectAmountFormBase
      title="How much do you want to withdraw?"
      token={market.asset}
      tokenBalance={tokenBalance}
      maxAmount={tokenBalance}
      validateAmount={validateAmount}
      submit={withdraw}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
    />
  )
}
