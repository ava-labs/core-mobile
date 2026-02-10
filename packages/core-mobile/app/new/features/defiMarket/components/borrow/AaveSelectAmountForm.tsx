import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address, formatUnits } from 'viem'
import { DefiMarket, MarketNames } from '../../types'
import {
  useUserBorrowData,
  convertUsdToTokenAmount
} from '../../hooks/useUserBorrowData'
import { AAVE_PRICE_ORACLE_SCALE } from '../../consts'
import { BorrowSelectAmountFormBase } from './BorrowSelectAmountFormBase'

export const BorrowAaveSelectAmountForm = ({
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
  // For AAVE, pass the underlying asset address to get price from AAVE Price Oracle
  const underlyingAssetAddress = market.asset.contractAddress as
    | Address
    | undefined
  const { data: borrowData } = useUserBorrowData(
    MarketNames.aave,
    underlyingAssetAddress
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

    // AAVE: USD amount is 8 decimals, price is 8 decimals
    const tokenAmount = convertUsdToTokenAmount({
      usdAmount: borrowData.availableBorrowsUSD,
      tokenPriceUSD: borrowData.tokenPriceUSD,
      tokenDecimals: market.asset.decimals,
      usdDecimals: AAVE_PRICE_ORACLE_SCALE,
      priceDecimals: AAVE_PRICE_ORACLE_SCALE
    })

    return new TokenUnit(
      tokenAmount,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [borrowData, market.asset.decimals, market.asset.symbol])

  // Current health factor (AAVE returns 18 decimals, 1e18 = 1.0)
  const currentHealthScore = useMemo(() => {
    if (!borrowData?.healthFactor) return undefined
    // Convert from 18 decimals to number
    return Number(formatUnits(borrowData.healthFactor, 18))
  }, [borrowData?.healthFactor])

  // Calculate new health score based on borrow amount
  // Formula: newHealthFactor = (totalCollateralUSD * liquidationThreshold / 10000) / (totalDebtUSD + newBorrowAmountUSD)
  const calculateHealthScore = useCallback(
    (borrowAmount: TokenUnit): number | undefined => {
      if (
        !borrowData?.totalCollateralUSD ||
        !borrowData?.liquidationThreshold ||
        !borrowData?.tokenPriceUSD
      ) {
        return undefined
      }

      const { totalCollateralUSD, totalDebtUSD, liquidationThreshold } =
        borrowData

      // Convert borrow amount to USD (8 decimals)
      // borrowAmountUSD = borrowAmount * tokenPriceUSD / 10^tokenDecimals
      const borrowAmountRaw = borrowAmount.toSubUnit()
      const newBorrowUSD =
        (borrowAmountRaw * borrowData.tokenPriceUSD) /
        BigInt(10 ** market.asset.decimals)

      const newTotalDebtUSD = totalDebtUSD + newBorrowUSD

      if (newTotalDebtUSD === 0n) {
        return undefined // Infinite health factor
      }

      // AAVE liquidationThreshold is in basis points (4 decimals, e.g., 8500 = 85%)
      // newHealthFactor = (totalCollateralUSD * liquidationThreshold) / (newTotalDebtUSD * 10000)
      // Result in 18 decimals for precision
      const newHealthFactorBigInt =
        (totalCollateralUSD * liquidationThreshold * BigInt(10 ** 18)) /
        (newTotalDebtUSD * BigInt(10000))

      return Number(formatUnits(newHealthFactorBigInt, 18))
    },
    [borrowData, market.asset.decimals]
  )

  // TODO: Implement borrow hook
  const handleSubmit = async ({
    amount
  }: {
    amount: TokenUnit
  }): Promise<string> => {
    // eslint-disable-next-line no-console
    console.log(
      'AAVE borrow:',
      amount.toDisplay(),
      onConfirmed,
      onReverted,
      onError
    )
    throw new Error('Borrow not implemented yet')
  }

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
