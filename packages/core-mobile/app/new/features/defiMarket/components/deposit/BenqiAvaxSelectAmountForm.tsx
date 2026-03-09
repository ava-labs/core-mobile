import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import { DefiMarket, DepositAsset } from '../../types'
import { MINT_GAS_AMOUNT, WAD } from '../../consts'
import { useMaxDepositAmount } from '../../hooks/useMaxDepositAmount'
import { useBenqiDepositAvax } from '../../hooks/benqi/useBenqiDepositAvax'
import { useBenqiBorrowData } from '../../hooks/benqi/useBenqiBorrowData'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const BenqiAvaxSelectAmountForm = ({
  asset,
  market,
  onSubmitted,
  onConfirmed,
  onReverted,
  onError
}: {
  asset: DepositAsset
  market: DefiMarket
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): JSX.Element => {
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      asset.token.balance,
      asset.token.decimals,
      asset.token.symbol
    )
  }, [asset.token])

  const { benqiDepositAvax } = useBenqiDepositAvax({
    market,
    onConfirmed,
    onReverted,
    onError
  })
  const { maxAmount } = useMaxDepositAmount({
    token: asset.token,
    gasAmount: MINT_GAS_AMOUNT
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
    (depositAmount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined
      const { liquidity, totalDebtUSD, tokenPriceUSD, collateralFactor } =
        borrowData
      if (totalDebtUSD === 0n) return Infinity
      const depositUSD =
        (depositAmount.toSubUnit() * tokenPriceUSD) / 10n ** BigInt(WAD)
      const depositCollateralEffect =
        (depositUSD * collateralFactor) / 10n ** BigInt(WAD)
      const newLiquidity = liquidity + depositCollateralEffect
      const numerator = newLiquidity + totalDebtUSD
      const newHealth = (numerator * 10n ** BigInt(WAD)) / totalDebtUSD
      return Number(newHealth) / Number(10n ** BigInt(WAD))
    },
    [borrowData]
  )

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error('The specified amount exceeds the available balance')
      }

      if (maxAmount && amt.gt(maxAmount)) {
        throw new Error(
          'The specified amount exceeds the available balance for gas fees'
        )
      }
    },
    [tokenBalance, maxAmount]
  )

  return (
    <SelectAmountFormBase
      token={asset.token}
      tokenBalance={tokenBalance}
      maxAmount={maxAmount}
      validateAmount={validateAmount}
      submit={benqiDepositAvax}
      onSubmitted={onSubmitted}
      currentHealthScore={hasDebt ? currentHealthScore : undefined}
      calculateHealthScore={hasDebt ? calculateHealthScore : undefined}
    />
  )
}
