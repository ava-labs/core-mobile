import React, { useEffect, useMemo, useState } from 'react'
import {
  SwapPricingDetailsScreen,
  type SchedulePromptType
} from 'features/swap/screens/SwapPricingDetailsScreen'
import { useSwapContext } from 'features/swap/contexts/SwapContext'
import { useRecurringSwapContext } from 'features/recurringSwap/contexts/RecurringSwapContext'
import { useRecurringQuote } from 'features/recurringSwap/hooks/useRecurringQuote'
import { TokenType } from '@avalabs/fusion-sdk'
import type {
  QuoteFee,
  QuoteFees,
  Caip2ChainId,
  QuoteFeeToken,
  RecurringQuoteResponse
} from '@avalabs/fusion-sdk'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Frequency, NumberOfOrders } from 'features/recurringSwap/types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'

// Wait this long before flipping into the "updating" prompt so quick
// refetches (e.g. tapping 10→11 orders, debounced quote arriving in <250ms)
// don't flash a spinner.
const SCHEDULE_FEE_LOADING_DEBOUNCE_MS = 250

type RecurringInputs = {
  isRecurring: boolean
  frequency: Frequency | undefined
  numberOfOrders: NumberOfOrders | undefined
  amount: bigint | undefined
}

/**
 * Maps the recurring-quote schedule fee (loose `type` enum, embedded
 * `token.chainId`) into the swap-quote `QuoteFee` shape so it composes
 * cleanly with `useQuoteFees(...)` in `SwapPricingDetailsScreen`.
 */
function buildScheduleExtraFees(
  isRecurring: boolean,
  data: RecurringQuoteResponse | undefined
): QuoteFees | undefined {
  if (!isRecurring || !data) return undefined
  const nativeToken: QuoteFeeToken = { type: TokenType.NATIVE }
  const mapped: QuoteFee[] = data.fees
    .filter(fee => fee.type === 'recurring' && !!fee.extra)
    .map(fee => ({
      type: 'other',
      fundingModel: 'additive',
      name: fee.name,
      amount: fee.amount,
      chainId: getEvmCaip2ChainId(fee.token.chainId) as Caip2ChainId,
      // Schedule fee is always denominated in the source-chain native token
      // (Markr only supports EVM recurring today).
      token: nativeToken
    }))
  return mapped.length > 0 ? mapped : undefined
}

function computePromptType(
  inputs: RecurringInputs,
  hasFee: boolean,
  showUpdating: boolean
): SchedulePromptType {
  if (!inputs.isRecurring) return undefined
  const hasInputs =
    !!inputs.frequency && inputs.numberOfOrders !== undefined && !!inputs.amount
  if (!hasInputs) return 'set-inputs'
  if (!hasFee && showUpdating) return 'updating'
  return undefined
}

/**
 * Drives the "schedule fee" line item state shown by the Pricing Details
 * modal. Returns `{ extraFees, schedulePromptType }` so the modal can both
 * include the loaded fee in the breakdown and (separately) communicate
 * missing-inputs / fetching states inline.
 */
function useSchedulePricingState(
  inputs: RecurringInputs,
  recurringQuote: UseQueryResult<RecurringQuoteResponse, Error>
): {
  extraFees: QuoteFees | undefined
  schedulePromptType: SchedulePromptType
} {
  const extraFees = useMemo(
    () => buildScheduleExtraFees(inputs.isRecurring, recurringQuote.data),
    [inputs.isRecurring, recurringQuote.data]
  )

  const hasInputs =
    !!inputs.frequency && inputs.numberOfOrders !== undefined && !!inputs.amount
  const wantsUpdatingPrompt = inputs.isRecurring && hasInputs && !extraFees

  const [showUpdating, setShowUpdating] = useState(false)
  useEffect(() => {
    if (!wantsUpdatingPrompt) {
      setShowUpdating(false)
      return
    }
    const t = setTimeout(
      () => setShowUpdating(true),
      SCHEDULE_FEE_LOADING_DEBOUNCE_MS
    )
    return () => clearTimeout(t)
  }, [wantsUpdatingPrompt])

  const schedulePromptType = computePromptType(
    inputs,
    !!extraFees,
    showUpdating
  )
  return { extraFees, schedulePromptType }
}

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

  const { extraFees, schedulePromptType } = useSchedulePricingState(
    {
      isRecurring: recurring.isRecurring,
      frequency: recurring.frequency,
      numberOfOrders: recurring.numberOfOrders,
      amount
    },
    recurringQuote
  )

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
      schedulePromptType={schedulePromptType}
    />
  )
}
