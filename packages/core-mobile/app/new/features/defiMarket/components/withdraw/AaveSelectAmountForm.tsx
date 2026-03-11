import React, { useCallback, useMemo, useRef } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import { transactionSnackbar } from 'common/utils/toast'
import { WAVAX_ADDRESS } from 'features/swap/consts'
import { DefiMarket } from '../../types'
import { AAVE_PRICE_ORACLE_SCALE } from '../../consts'
import { convertUsdToTokenAmount } from '../../utils/convertUsdToTokenAmount'
import { useAaveWithdraw } from '../../hooks/aave/useAaveWithdraw'
import { useAaveBorrowData } from '../../hooks/aave/useAaveBorrowData'
import { useAaveHealthScore } from '../../hooks/aave/useAaveHealthScore'
import { useAaveZeroLtvCollateral } from '../../hooks/aave/useAaveZeroLtvCollateral'
import { useUnwrapWavax } from '../../hooks/useUnwrapWavax'
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
  // Check if this is native AVAX (no contractAddress)
  const isNativeAvax = !market.asset.contractAddress

  // Store pending amount for unwrap after withdraw confirmation
  const pendingUnwrapAmountRef = useRef<TokenUnit | null>(null)

  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      market.asset.mintTokenBalance.balance,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [market])

  // Unwrap hook - called after withdraw is confirmed for native AVAX
  const { unwrapWavax } = useUnwrapWavax({
    network: market.network,
    onConfirmed, // Final confirmation after unwrap
    onReverted,
    onError
  })

  // Handle withdraw confirmation - trigger unwrap for native AVAX
  const handleWithdrawConfirmed = useCallback(async () => {
    if (isNativeAvax && pendingUnwrapAmountRef.current) {
      // Show toast before unwrap
      transactionSnackbar.pending({ message: 'Unwrapping WAVAX to AVAX...' })
      // Withdraw confirmed, now unwrap WAVAX to AVAX
      const amountToUnwrap = pendingUnwrapAmountRef.current
      try {
        await unwrapWavax({ amount: amountToUnwrap })
        // Only clear after successful submission
        pendingUnwrapAmountRef.current = null
      } catch (error) {
        // Show error toast for submission failures
        // (onError callback handles post-submission errors)
        transactionSnackbar.error({
          message: 'Failed to unwrap WAVAX to AVAX'
        })
        onError?.()
      }
    } else {
      // Not native AVAX, call original onConfirmed
      onConfirmed?.()
    }
  }, [isNativeAvax, unwrapWavax, onConfirmed, onError])

  const { withdraw } = useAaveWithdraw({
    market,
    onConfirmed: handleWithdrawConfirmed,
    onReverted,
    onError
  })

  const underlyingAssetAddress = (market.asset.contractAddress ??
    WAVAX_ADDRESS) as Address
  const { data: borrowData } = useAaveBorrowData(underlyingAssetAddress)
  const { currentHealthScore, calculateHealthScore } = useAaveHealthScore({
    borrowData,
    tokenDecimals: market.asset.decimals,
    direction: 'withdraw'
  })

  const { blockingError: zeroLtvError } = useAaveZeroLtvCollateral()
  const hasDebt = borrowData !== undefined && borrowData.totalDebtUSD > 0n
  const blockingError = hasDebt ? zeroLtvError : undefined

  // Max safe withdraw: keep health factor >= 1.01 (liquidation threshold-based)
  const maxWithdrawAmount = useMemo(() => {
    if (
      !borrowData ||
      borrowData.totalDebtUSD === 0n ||
      !borrowData.tokenPriceUSD ||
      !borrowData.liquidationThreshold
    ) {
      return tokenBalance
    }
    const minCollateralUSD =
      (borrowData.totalDebtUSD * 10200n) / borrowData.liquidationThreshold
    const maxWithdrawUSD =
      borrowData.totalCollateralUSD > minCollateralUSD
        ? borrowData.totalCollateralUSD - minCollateralUSD
        : 0n
    const maxTokens = convertUsdToTokenAmount({
      usdAmount: maxWithdrawUSD,
      tokenPriceUSD: borrowData.tokenPriceUSD,
      tokenDecimals: market.asset.decimals,
      usdDecimals: AAVE_PRICE_ORACLE_SCALE,
      priceDecimals: AAVE_PRICE_ORACLE_SCALE,
      safetyBufferPercent: 0
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

  // For native AVAX: withdraw WAVAX, then unwrap to AVAX after confirmation
  // For other tokens: withdraw directly
  const handleSubmit = useCallback(
    async ({ amount }: { amount: TokenUnit }): Promise<string> => {
      if (isNativeAvax) {
        // Store amount for unwrap after withdraw confirmation
        pendingUnwrapAmountRef.current = amount
      }
      // For native AVAX, disable confetti on withdraw tx (will show on unwrap tx instead)
      return withdraw({ amount, confettiDisabled: isNativeAvax })
    },
    [withdraw, isNativeAvax]
  )

  return (
    <SelectAmountFormBase
      title="How much do you want to withdraw?"
      token={market.asset}
      tokenBalance={tokenBalance}
      maxAmount={maxWithdrawAmount}
      validateAmount={validateAmount}
      submit={handleSubmit}
      onSubmitted={onSubmitted}
      currentHealthScore={currentHealthScore}
      calculateHealthScore={calculateHealthScore}
      balanceLabel="Available to withdraw:"
      maxAmountZeroMessage="Your position is too close to liquidation to withdraw"
      blockingError={blockingError}
    />
  )
}
