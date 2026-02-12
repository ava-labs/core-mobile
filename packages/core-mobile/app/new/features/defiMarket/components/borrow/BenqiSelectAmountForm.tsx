import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import { DefiMarket } from '../../types'
import { convertUsdToTokenAmount } from '../../utils/borrow'
import { WAD } from '../../consts'
import { useBenqiBorrowData } from '../../hooks/benqi/useBenqiBorrowData'
import { useBenqiBorrow } from '../../hooks/benqi/useBenqiBorrow'
import { BorrowSelectAmountFormBase } from './BorrowSelectAmountFormBase'

export const BorrowBenqiSelectAmountForm = ({
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
  // For Benqi, pass the qToken address to get price from Benqi Price Oracle
  const qTokenAddress = market.asset.mintTokenAddress as Address
  const { data: borrowData, isLoading } = useBenqiBorrowData(qTokenAddress)

  // Calculate available to borrow in token units using oracle price
  const availableToBorrow = useMemo(() => {
    if (!borrowData?.availableBorrowsUSD || !borrowData?.tokenPriceUSD) {
      return new TokenUnit(
        BigInt(0),
        market.asset.decimals,
        market.asset.symbol
      )
    }

    // Benqi: USD amount is 18 decimals
    // Benqi Price Oracle returns: price * 10^(36 - underlyingDecimals)
    const priceDecimals = 36 - market.asset.decimals
    const tokenAmount = convertUsdToTokenAmount({
      usdAmount: borrowData.availableBorrowsUSD,
      tokenPriceUSD: borrowData.tokenPriceUSD,
      tokenDecimals: market.asset.decimals,
      usdDecimals: WAD,
      priceDecimals
    })

    return new TokenUnit(
      tokenAmount,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [borrowData, market.asset.decimals, market.asset.symbol])

  // Calculate current health score
  // For Benqi: health = (liquidity + totalDebtUSD) / totalDebtUSD
  // When totalDebtUSD is 0, health is infinite
  const currentHealthScore = useMemo(() => {
    if (!borrowData) return undefined

    const { liquidity, totalDebtUSD } = borrowData

    // If no borrows, health is infinite
    if (totalDebtUSD === 0n) {
      return Infinity
    }

    // health = (liquidity + totalDebt) / totalDebt
    // This gives us: health = 1 + (liquidity / totalDebt)
    const numerator = liquidity + totalDebtUSD
    const healthBigInt = (numerator * BigInt(10 ** 18)) / totalDebtUSD
    return Number(healthBigInt) / 10 ** 18
  }, [borrowData])

  // Calculate new health score based on borrow amount
  // Formula: newHealth = (liquidity + totalDebt) / (totalDebt + newBorrow)
  // Note: liquidity already accounts for collateral factors
  const calculateHealthScore = useCallback(
    (borrowAmount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined

      const { liquidity, totalDebtUSD, tokenPriceUSD } = borrowData

      // Convert borrow amount to USD (18 decimals)
      // borrowAmountUSD = borrowAmount * tokenPrice / 10^tokenDecimals
      // Since tokenPrice is scaled by 10^(36-decimals), and we want 18 decimals:
      // borrowAmountUSD = borrowAmount * tokenPrice / 10^(36-decimals) * 10^18 / 10^tokenDecimals
      // = borrowAmount * tokenPrice / 10^18
      const borrowAmountRaw = borrowAmount.toSubUnit()
      const newBorrowUSD = (borrowAmountRaw * tokenPriceUSD) / BigInt(10 ** WAD)

      const newTotalDebt = totalDebtUSD + newBorrowUSD

      if (newTotalDebt === 0n) {
        return Infinity
      }

      // newHealth = (liquidity + currentTotalDebt) / newTotalDebt
      // Note: We use (liquidity + currentTotalDebt) because this represents
      // the total "borrowing capacity" before the new borrow
      const numerator = liquidity + totalDebtUSD
      const newHealthBigInt = (numerator * BigInt(10 ** 18)) / newTotalDebt
      return Number(newHealthBigInt) / 10 ** 18
    },
    [borrowData]
  )

  // Benqi borrow hook
  const { benqiBorrow } = useBenqiBorrow({
    market,
    onConfirmed,
    onReverted,
    onError
  })

  const handleSubmit = useCallback(
    async ({ amount }: { amount: TokenUnit }): Promise<string> => {
      return benqiBorrow({ amount })
    },
    [benqiBorrow]
  )

  return (
    <BorrowSelectAmountFormBase
      token={market.asset}
      availableToBorrow={availableToBorrow}
      currentHealthScore={currentHealthScore}
      calculateHealthScore={calculateHealthScore}
      submit={handleSubmit}
      onSubmitted={onSubmitted}
      isLoading={isLoading}
    />
  )
}
