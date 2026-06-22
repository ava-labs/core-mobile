import React, { useMemo } from 'react'
import { SwapPricingDetailsScreen } from 'features/swap/screens/SwapPricingDetailsScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'
import { useRecurringSwapContext } from 'features/recurringSwap/contexts/RecurringSwapContext'
import { useRecurringQuote } from 'features/recurringSwap/hooks/useRecurringQuote'
import { TokenType } from '@avalabs/fusion-sdk'
import type {
  QuoteFee,
  QuoteFees,
  Caip2ChainId,
  QuoteFeeToken
} from '@avalabs/fusion-sdk'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'

export default (): JSX.Element => {
  const {
    bestQuote,
    selectQuoteById,
    allQuotes,
    userQuote,
    activeQuote,
    fromToken,
    toToken,
    amount,
    slippage,
    autoSlippage
  } = useSwapContext()
  const recurring = useRecurringSwapContext()

  // Same param shape as SwapScreen so the queryKey hits the React Query
  // cache populated there — no duplicate fetch.
  const recurringSlippageBps =
    autoSlippage || slippage === undefined
      ? undefined
      : Math.round(slippage * 100)
  const recurringQuote = useRecurringQuote({
    fromToken: recurring.isRecurring ? fromToken ?? undefined : undefined,
    toToken: recurring.isRecurring ? toToken ?? undefined : undefined,
    amountPerOrder: recurring.isRecurring ? amount : undefined,
    numberOfOrders: recurring.numberOfOrders,
    frequency: recurring.frequency,
    slippageBps: recurringSlippageBps
  })

  // Surface only the recurring schedule fee (the one keyed `extra`) as a
  // breakdown line item. Other recurring-quote fees overlap with the per-
  // swap fees already in `activeQuote.fees`. The recurring-quote fee shape
  // differs from the swap-quote fee shape (looser `type` enum, embedded
  // `token.chainId`), so map it into `QuoteFee` here at the boundary.
  const extraFees = useMemo<QuoteFees | undefined>(() => {
    if (!recurring.isRecurring || !recurringQuote.data) return undefined
    const nativeToken: QuoteFeeToken = { type: TokenType.NATIVE }
    const mapped: QuoteFee[] = recurringQuote.data.fees
      .filter(fee => fee.type === 'recurring' && !!fee.extra)
      .map(fee => ({
        type: 'other',
        fundingModel: 'additive',
        name: fee.name,
        amount: fee.amount,
        chainId: getEvmCaip2ChainId(fee.token.chainId) as Caip2ChainId,
        // Schedule fee is always denominated in the source-chain native
        // token (Markr only supports EVM recurring today).
        token: nativeToken
      }))
    return mapped.length > 0 ? mapped : undefined
  }, [recurring.isRecurring, recurringQuote.data])

  return (
    <SwapPricingDetailsScreen
      fromToken={fromToken}
      toToken={toToken}
      bestQuote={bestQuote}
      userQuote={userQuote}
      selectedQuote={activeQuote}
      allQuotes={allQuotes}
      selectQuoteById={selectQuoteById}
      extraFees={extraFees}
    />
  )
}
