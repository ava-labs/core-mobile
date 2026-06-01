import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Button, Text, View } from '@avalabs/k2-alpine'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSelector } from 'react-redux'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { selectActiveAccount } from 'store/account'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSwapContext } from 'features/swap/contexts/SwapContext'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { formatTokenAmount } from 'utils/Utils'
import { useRecurringSwapContext } from '../contexts/RecurringSwapContext'
import { useRecurringQuote } from '../hooks/useRecurringQuote'
import { RecurringDetailsRows } from '../components/RecurringDetailsRows'
import { submitRecurringSwap } from '../utils/submitRecurringSwap'
import { UNLIMITED_ORDERS } from '../types'

/**
 * Review screen for the recurring-swap (DCA) flow.
 *
 * Receives `amountPerOrderRaw` (smallest-unit bigint string) and
 * `amountPerOrder` (display-formatted string) from SwapScreen via
 * expo-router search params.
 *
 * Displays:
 *  - RecurringDetailsRows (frequency / number of orders / estimated total spend)
 *  - Disclaimer summary text
 *  - "Next" footer button that dispatches approve + fill through ApprovalController
 */
export function RecurringSwapReviewScreen(): JSX.Element {
  const router = useRouter()
  const activeAccount = useSelector(selectActiveAccount)
  const { fromToken, toToken, slippage, autoSlippage } = useSwapContext()
  const { frequency, numberOfOrders } = useRecurringSwapContext()
  const { request } = useInAppRequest()

  const { amountPerOrder: amountPerOrderStr, amountPerOrderRaw } =
    useLocalSearchParams<{
      amountPerOrder?: string
      amountPerOrderRaw?: string
    }>()

  // Use the raw bigint string for precise quote calculations.
  const amountPerOrder = useMemo<bigint>(
    () => (amountPerOrderRaw ? BigInt(amountPerOrderRaw) : 0n),
    [amountPerOrderRaw]
  )

  const [submitting, setSubmitting] = useState(false)

  // `slippage` in SwapContext is in percent (e.g. 2 = 2%).
  // useRecurringQuote and submitRecurringSwap both expect basis points.
  // When auto-slippage is enabled, pass undefined so the server picks the
  // optimal value from its recommendation.
  const slippageBps = useMemo(
    () => (autoSlippage ? undefined : Math.round((slippage ?? 0) * 100)),
    [autoSlippage, slippage]
  )

  const quote = useRecurringQuote({
    fromToken: fromToken ?? undefined,
    toToken: toToken ?? undefined,
    amountPerOrder,
    numberOfOrders,
    frequency,
    slippageBps
  })

  const isUnlimited = numberOfOrders === UNLIMITED_ORDERS

  const fromDecimals =
    fromToken && 'decimals' in fromToken ? fromToken.decimals : 18
  const fromSymbol = fromToken && 'symbol' in fromToken ? fromToken.symbol : ''
  const toSymbol = toToken && 'symbol' in toToken ? toToken.symbol : ''

  // Formatted display amount (e.g. "1,500.00 USDC").
  // Falls back to the string passed from SwapScreen when the raw value is missing.
  const displayAmountPerOrder = useMemo(() => {
    if (amountPerOrder && amountPerOrder > 0n) {
      return `${formatTokenAmount(
        bigintToBig(amountPerOrder, fromDecimals),
        fromDecimals
      )} ${fromSymbol}`
    }
    return amountPerOrderStr ? `${amountPerOrderStr} ${fromSymbol}` : '—'
  }, [amountPerOrder, amountPerOrderStr, fromDecimals, fromSymbol])

  const handleNext = useCallback(async () => {
    if (!quote.data || !activeAccount || !fromToken || !toToken) return
    if (!('address' in fromToken) || !('decimals' in fromToken)) return
    if (!('address' in toToken) || !('decimals' in toToken)) return
    if (!frequency || numberOfOrders === undefined) return

    setSubmitting(true)
    try {
      await submitRecurringSwap({
        request,
        quote: quote.data,
        activeAccount: { addressC: activeAccount.addressC ?? '' },
        fromToken: {
          address: fromToken.address,
          symbol: fromToken.symbol,
          decimals: fromToken.decimals,
          networkChainId: fromToken.networkChainId
        },
        toToken: {
          address: toToken.address,
          symbol: toToken.symbol,
          decimals: toToken.decimals,
          networkChainId: toToken.networkChainId
        },
        frequency,
        numberOfOrders,
        amountPerOrder,
        slippageBps
      })
      // Submission complete. The task-21 listener handles schedule persistence,
      // analytics, and success toast after the fill tx confirms.
      router.dismissAll()
    } catch {
      // Rejection / network errors are surfaced by the underlying
      // ApprovalController modal and toast system. Just re-enable the button.
    } finally {
      setSubmitting(false)
    }
  }, [
    quote.data,
    activeAccount,
    fromToken,
    toToken,
    frequency,
    numberOfOrders,
    amountPerOrder,
    slippageBps,
    request,
    router
  ])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        onPress={handleNext}
        disabled={!quote.data || submitting || !activeAccount}>
        {submitting ? 'Processing…' : 'Next'}
      </Button>
    ),
    [handleNext, quote.data, submitting, activeAccount]
  )

  const disclaimerText = useMemo(() => {
    if (!fromToken || !toToken || !frequency || numberOfOrders === undefined)
      return ''
    const cadence = `${frequency.value} ${
      frequency.value === 1 ? frequency.unit : `${frequency.unit}s`
    }`
    const ordersClause = isUnlimited
      ? 'for an unlimited amount of time'
      : numberOfOrders === 1
      ? 'for 1 order'
      : `for ${numberOfOrders} orders`
    return (
      `You will swap ${displayAmountPerOrder} for ${toSymbol} every ${cadence}, ` +
      `${ordersClause}. ` +
      `First swap executes immediately after approval. ` +
      `Each swap requires sufficient balance, otherwise the swap will fail.`
    )
  }, [
    fromToken,
    toToken,
    frequency,
    numberOfOrders,
    isUnlimited,
    displayAmountPerOrder,
    toSymbol
  ])

  return (
    <ScrollScreen
      title="Swap"
      navigationTitle="Review"
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <RecurringDetailsRows
        amountPerOrder={
          amountPerOrder > 0n
            ? formatTokenAmount(
                bigintToBig(amountPerOrder, fromDecimals),
                fromDecimals
              )
            : amountPerOrderStr ?? undefined
        }
        fromTokenSymbol={fromSymbol || undefined}
        toTokenSymbol={toSymbol || undefined}
        fromTokenDecimals={fromDecimals}
      />
      {quote.isPending && (
        <View sx={{ marginTop: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" />
        </View>
      )}
      {quote.isError && (
        <View sx={{ marginTop: 16, paddingHorizontal: 4 }}>
          <Text variant="caption" sx={{ color: '$textDanger' }}>
            Unable to fetch quote. Try again.
          </Text>
        </View>
      )}
      {!!disclaimerText && (
        <View sx={{ marginTop: 16, paddingHorizontal: 4 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            {disclaimerText}
          </Text>
        </View>
      )}
    </ScrollScreen>
  )
}
