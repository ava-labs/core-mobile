import React, { useCallback, useMemo, useRef } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address, formatUnits } from 'viem'
import { transactionSnackbar } from 'common/utils/toast'
import { DefiMarket } from '../../types'
import { convertUsdToTokenAmount } from '../../utils/borrow'
import {
  AAVE_PRICE_ORACLE_SCALE,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  WAD
} from '../../consts'
import { useAaveBorrowData } from '../../hooks/aave/useAaveBorrowData'
import { useAaveBorrowErc20 } from '../../hooks/aave/useAaveBorrowErc20'
import { useUnwrapWavax } from '../../hooks/useUnwrapWavax'
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
  // Check if this is native AVAX (no contractAddress)
  const isNativeAvax = !market.asset.contractAddress

  // Store pending amount for unwrap after borrow confirmation
  const pendingUnwrapAmountRef = useRef<TokenUnit | null>(null)

  // For AAVE, pass the underlying asset address to get price from AAVE Price Oracle
  // For native AVAX, use WAVAX address
  const underlyingAssetAddress = (market.asset.contractAddress ??
    AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS) as Address
  const { data: borrowData, isLoading } = useAaveBorrowData(
    underlyingAssetAddress
  )

  // Unwrap hook - called after borrow is confirmed for native AVAX
  const { unwrapWavax } = useUnwrapWavax({
    network: market.network,
    onConfirmed, // Final confirmation after unwrap
    onReverted,
    onError
  })

  // Handle borrow confirmation - trigger unwrap for native AVAX
  const handleBorrowConfirmed = useCallback(() => {
    if (isNativeAvax && pendingUnwrapAmountRef.current) {
      // Show toast before unwrap
      transactionSnackbar.pending({ message: 'Unwrapping WAVAX to AVAX...' })
      // Borrow confirmed, now unwrap WAVAX to AVAX
      // Error handling is done by useUnwrapWavax's onError callback
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unwrapWavax({ amount: pendingUnwrapAmountRef.current }).catch(() => {})
      pendingUnwrapAmountRef.current = null
    } else {
      // Not native AVAX, call original onConfirmed
      onConfirmed?.()
    }
  }, [isNativeAvax, unwrapWavax, onConfirmed])

  // Borrow hook - always use ERC20 borrow (WAVAX for native AVAX market)
  const { aaveBorrowErc20 } = useAaveBorrowErc20({
    market,
    onConfirmed: handleBorrowConfirmed,
    onReverted,
    onError
  })

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
    if (!borrowData) return undefined
    // Convert from 18 decimals to number
    return Number(formatUnits(borrowData.healthFactor, WAD))
  }, [borrowData])

  // Calculate new health score based on borrow amount
  // Formula: newHealthFactor = (totalCollateralUSD * liquidationThreshold / 10000) / (totalDebtUSD + newBorrowAmountUSD)
  const calculateHealthScore = useCallback(
    (borrowAmount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined

      const {
        totalCollateralUSD,
        totalDebtUSD,
        liquidationThreshold,
        tokenPriceUSD
      } = borrowData

      // Convert borrow amount to USD (8 decimals)
      // borrowAmountUSD = borrowAmount * tokenPriceUSD / 10^tokenDecimals
      const borrowAmountRaw = borrowAmount.toSubUnit()
      const newBorrowUSD =
        (borrowAmountRaw * tokenPriceUSD) / BigInt(10 ** market.asset.decimals)

      const newTotalDebtUSD = totalDebtUSD + newBorrowUSD

      if (newTotalDebtUSD === 0n) {
        return undefined // Infinite health factor
      }

      // AAVE liquidationThreshold is in basis points (4 decimals, e.g., 8500 = 85%)
      // newHealthFactor = (totalCollateralUSD * liquidationThreshold) / (newTotalDebtUSD * 10000)
      // Result in 18 decimals for precision
      const newHealthFactor =
        (totalCollateralUSD * liquidationThreshold * BigInt(10 ** WAD)) /
        (newTotalDebtUSD * BigInt(10000))

      return Number(formatUnits(newHealthFactor, WAD))
    },
    [borrowData, market.asset.decimals]
  )

  // For native AVAX: borrow WAVAX, then unwrap to AVAX after confirmation
  // For other tokens: borrow ERC20 directly
  const handleSubmit = useCallback(
    async ({ amount }: { amount: TokenUnit }): Promise<string> => {
      if (isNativeAvax) {
        // Store amount for unwrap after borrow confirmation
        pendingUnwrapAmountRef.current = amount
      }
      // For native AVAX, disable confetti on borrow tx (will show on unwrap tx instead)
      return aaveBorrowErc20({ amount, confettiDisabled: isNativeAvax })
    },
    [aaveBorrowErc20, isNativeAvax]
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
