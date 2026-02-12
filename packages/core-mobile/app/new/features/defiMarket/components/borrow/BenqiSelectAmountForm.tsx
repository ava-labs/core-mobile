import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import {
  convertUsdToTokenAmount,
  useUserBorrowData
} from 'features/defiMarket/hooks/useUserBorrowData'
import { DefiMarket, MarketNames } from '../../types'
import { WAD } from '../../consts'
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
  const { data: borrowData } = useUserBorrowData(
    MarketNames.benqi,
    qTokenAddress
  )

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
  // For Benqi: health = (liquidity + totalBorrowUSD) / totalBorrowUSD
  // When totalBorrowUSD is 0, health is infinite
  const currentHealthScore = useMemo(() => {
    if (!borrowData?.benqiLiquidity) return undefined

    const { benqiLiquidity, benqiTotalBorrowUSD } = borrowData

    // If no borrows, health is infinite
    if (!benqiTotalBorrowUSD || benqiTotalBorrowUSD === 0n) {
      return Infinity
    }

    // health = (liquidity + totalBorrow) / totalBorrow
    // This gives us: health = 1 + (liquidity / totalBorrow)
    // When liquidity = totalBorrow * (health - 1)
    const numerator = benqiLiquidity + benqiTotalBorrowUSD
    const healthBigInt = (numerator * BigInt(10 ** 18)) / benqiTotalBorrowUSD
    return Number(healthBigInt) / 10 ** 18
  }, [borrowData])

  // Calculate new health score based on borrow amount
  // Formula: newHealth = (liquidity + totalBorrow) / (totalBorrow + newBorrow)
  // Note: liquidity already accounts for collateral factors
  const calculateHealthScore = useCallback(
    (borrowAmount: TokenUnit): number | undefined => {
      if (!borrowData?.benqiLiquidity || !borrowData?.tokenPriceUSD) {
        return undefined
      }

      const { benqiLiquidity, benqiTotalBorrowUSD, tokenPriceUSD } = borrowData
      const currentTotalBorrow = benqiTotalBorrowUSD ?? 0n

      // Convert borrow amount to USD (18 decimals)
      // borrowAmountUSD = borrowAmount * tokenPrice / 10^tokenDecimals
      // Since tokenPrice is scaled by 10^(36-decimals), and we want 18 decimals:
      // borrowAmountUSD = borrowAmount * tokenPrice / 10^(36-decimals) * 10^18 / 10^tokenDecimals
      // = borrowAmount * tokenPrice / 10^18
      const borrowAmountRaw = borrowAmount.toSubUnit()
      const newBorrowUSD = (borrowAmountRaw * tokenPriceUSD) / BigInt(10 ** WAD)

      const newTotalBorrow = currentTotalBorrow + newBorrowUSD

      if (newTotalBorrow === 0n) {
        return Infinity
      }

      // newHealth = (liquidity + currentTotalBorrow) / newTotalBorrow
      // Note: We use (liquidity + currentTotalBorrow) because this represents
      // the total "borrowing capacity" before the new borrow
      const numerator = benqiLiquidity + currentTotalBorrow
      const newHealthBigInt = (numerator * BigInt(10 ** 18)) / newTotalBorrow
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
    />
  )
}
