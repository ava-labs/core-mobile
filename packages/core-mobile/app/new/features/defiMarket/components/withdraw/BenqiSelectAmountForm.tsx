import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import { DefiMarket } from '../../types'
import { WAD, WAD_SCALE } from '../../consts'
import { convertUsdToTokenAmount } from '../../utils/convertUsdToTokenAmount'
import { useBenqiWithdraw } from '../../hooks/benqi/useBenqiWithdraw'
import { useBenqiBorrowData } from '../../hooks/benqi/useBenqiBorrowData'
import { useBenqiHealthScore } from '../../hooks/benqi/useBenqiHealthScore'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const WithdrawBenqiSelectAmountForm = ({
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

  const { withdraw } = useBenqiWithdraw({
    market,
    onConfirmed,
    onReverted,
    onError
  })

  const { data: borrowData } = useBenqiBorrowData(
    market.asset.mintTokenAddress as Address
  )
  const { currentHealthScore, calculateHealthScore } = useBenqiHealthScore({
    borrowData,
    direction: 'withdraw'
  })

  // Max safe withdraw: keep health factor at same level as borrow max
  // maxWithdrawUSD = liquidity * 10^WAD / collateralFactor
  const maxWithdrawAmount = useMemo(() => {
    if (
      !borrowData ||
      borrowData.totalDebtUSD === 0n ||
      !borrowData.tokenPriceUSD ||
      !borrowData.collateralFactor
    ) {
      return tokenBalance
    }
    const maxWithdrawUSD =
      (borrowData.liquidity * WAD_SCALE) / borrowData.collateralFactor
    const priceDecimals = 36 - market.asset.decimals
    const maxTokens = convertUsdToTokenAmount({
      usdAmount: maxWithdrawUSD,
      tokenPriceUSD: borrowData.tokenPriceUSD,
      tokenDecimals: market.asset.decimals,
      usdDecimals: WAD,
      priceDecimals
    })
    const maxUnit = new TokenUnit(
      maxTokens,
      market.asset.decimals,
      market.asset.symbol
    )
    return maxUnit.lt(tokenBalance) ? maxUnit : tokenBalance
  }, [borrowData, tokenBalance, market.asset])

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error('The specified amount exceeds the available balance')
      }
      if (maxWithdrawAmount && amt.gt(maxWithdrawAmount)) {
        throw new Error(
          'The specified amount exceeds the available to withdraw'
        )
      }
    },
    [tokenBalance, maxWithdrawAmount]
  )

  return (
    <SelectAmountFormBase
      title="How much do you want to withdraw?"
      token={market.asset}
      tokenBalance={tokenBalance}
      maxAmount={maxWithdrawAmount}
      validateAmount={validateAmount}
      submit={withdraw}
      onSubmitted={onSubmitted}
      currentHealthScore={currentHealthScore}
      calculateHealthScore={calculateHealthScore}
      balanceLabel="Available to withdraw:"
      maxAmountZeroMessage="Your position is too close to liquidation to withdraw"
    />
  )
}
