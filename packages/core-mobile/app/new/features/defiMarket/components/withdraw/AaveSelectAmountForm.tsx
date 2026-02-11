import React, { useCallback, useMemo, useRef } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { DefiMarket } from '../../types'
import { useAaveWithdraw } from '../../hooks/aave/useAaveWithdraw'
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
  const handleWithdrawConfirmed = useCallback(() => {
    if (isNativeAvax && pendingUnwrapAmountRef.current) {
      // Withdraw confirmed, now unwrap WAVAX to AVAX
      unwrapWavax({ amount: pendingUnwrapAmountRef.current })
      pendingUnwrapAmountRef.current = null
    } else {
      // Not native AVAX, call original onConfirmed
      onConfirmed?.()
    }
  }, [isNativeAvax, unwrapWavax, onConfirmed])

  const { withdraw } = useAaveWithdraw({
    market,
    onConfirmed: handleWithdrawConfirmed,
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
      maxAmount={tokenBalance}
      validateAmount={validateAmount}
      submit={handleSubmit}
      onSubmitted={onSubmitted}
    />
  )
}
