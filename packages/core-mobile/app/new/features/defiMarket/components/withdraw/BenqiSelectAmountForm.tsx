import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import { DefiMarket } from '../../types'
import { WAD } from '../../consts'
import { convertUsdToTokenAmount } from '../../utils/convertUsdToTokenAmount'
import { useBenqiWithdraw } from '../../hooks/benqi/useBenqiWithdraw'
import { useBenqiBorrowData } from '../../hooks/benqi/useBenqiBorrowData'
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

  const qTokenAddress = market.asset.mintTokenAddress as Address
  const { data: borrowData } = useBenqiBorrowData(qTokenAddress)

  const currentHealthScore = useMemo(() => {
    if (!borrowData) return undefined
    const { liquidity, totalDebtUSD } = borrowData
    if (totalDebtUSD === 0n) return Infinity
    const numerator = liquidity + totalDebtUSD
    const health = (numerator * 10n ** BigInt(WAD)) / totalDebtUSD
    return Number(health) / Number(10n ** BigInt(WAD))
  }, [borrowData])

  const hasDebt = borrowData !== undefined && borrowData.totalDebtUSD > 0n

  const calculateHealthScore = useCallback(
    (withdrawAmount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined
      const { liquidity, totalDebtUSD, tokenPriceUSD, collateralFactor } =
        borrowData
      if (totalDebtUSD === 0n) return Infinity
      const withdrawUSD =
        (withdrawAmount.toSubUnit() * tokenPriceUSD) / 10n ** BigInt(WAD)
      const withdrawCollateralEffect =
        (withdrawUSD * collateralFactor) / 10n ** BigInt(WAD)
      const newLiquidity =
        liquidity > withdrawCollateralEffect
          ? liquidity - withdrawCollateralEffect
          : 0n
      const numerator = newLiquidity + totalDebtUSD
      const newHealth = (numerator * 10n ** BigInt(WAD)) / totalDebtUSD
      return Number(newHealth) / Number(10n ** BigInt(WAD))
    },
    [borrowData]
  )

  // Max safe withdraw: keep health factor at same level as borrow max
  // maxWithdrawUSD = liquidity * 10^WAD / collateralFactor
  const maxWithdrawAmount = useMemo(() => {
    if (
      !hasDebt ||
      !borrowData?.tokenPriceUSD ||
      !borrowData.collateralFactor
    ) {
      return tokenBalance
    }
    const maxWithdrawUSD =
      (borrowData.liquidity * 10n ** BigInt(WAD)) / borrowData.collateralFactor
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
  }, [hasDebt, borrowData, tokenBalance, market.asset])

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
      currentHealthScore={hasDebt ? currentHealthScore : undefined}
      calculateHealthScore={hasDebt ? calculateHealthScore : undefined}
      balanceLabel="Available to withdraw:"
      maxAmountZeroMessage="Your position is too close to liquidation to withdraw"
    />
  )
}
