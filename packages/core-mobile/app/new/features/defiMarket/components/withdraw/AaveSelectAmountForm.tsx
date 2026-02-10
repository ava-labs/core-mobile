import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { DefiMarket } from '../../types'
import { useAaveWithdraw } from '../../hooks/aave/useAaveWithdraw'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const WithdrawAaveSelectAmountForm = ({
  market,
  onSubmitted,
  onConfirmed,
  onReverted,
  onError
}: {
  market: DefiMarket
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): JSX.Element => {
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      market.asset.mintTokenBalance.balance,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [market])

  const { withdraw } = useAaveWithdraw({
    market,
    onConfirmed,
    onReverted,
    onError
  })

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error('The specified amount exceeds the available balance')
      }
    },
    [tokenBalance]
  )

  return (
    <SelectAmountFormBase
      title="How much do you want to withdraw?"
      token={market.asset}
      tokenBalance={tokenBalance}
      maxAmount={tokenBalance}
      validateAmount={validateAmount}
      submit={withdraw}
      onSubmitted={onSubmitted}
    />
  )
}
