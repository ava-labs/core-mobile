import { TokenType } from '@avalabs/vm-module-types'
import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import {
  selectFusionMaxAmountGasSafetyBps,
  selectFusionMaxAmountAdditiveBpsDefault,
  selectFusionMaxAmountAdditiveBpsEvmToSolana,
  selectFusionMaxAmountAdditiveBpsSolanaToEvm
} from 'store/posthog'
import { useIsFusionServiceReady } from '../useZustandStore'
import { useFeeEstimation } from '../useFeeEstimation'
import {
  getTotalAdditiveSourceFee,
  getTotalAdditiveNativeFee
} from '../../utils/getTotalAdditiveSourceFee'
import { getTokenKey } from '../../utils/tokenKey'
import { usePreQuote } from './usePreQuote'
import { useSpendableXpBalance } from './useSpendableXpBalance'
import {
  computeIsMaxLoading,
  computeMaxAmount,
  getPreQuoteAmount,
  getRouteAdditiveBps,
  resolveAdditiveFeeForMax
} from './utils'

/**
 * Bridges transient max recalculations with the last known value.
 *
 * The fee estimate is re-fetched from scratch every time the pre-quote
 * refreshes (its query key includes the quote id), which flips the computed
 * max to undefined for the duration of each re-estimate — and the Max button
 * into its disabled look every quote cycle. While such a recalculation is in
 * flight (`shouldHold`), keep serving the last max computed for the SAME
 * source token; a token change drops the held value immediately.
 *
 * Callers must NOT hold across the X/P spendable-balance refetch (CP-13903):
 * a stale spendable-derived Max could overspend the current UTXO set.
 */
const useHoldMaxWhileRecalculating = ({
  max,
  fromToken,
  shouldHold
}: {
  max: bigint | undefined
  fromToken: LocalTokenWithBalance | undefined
  shouldHold: boolean
}): bigint | undefined => {
  const lastKnownRef = useRef<{ tokenKey: string; value: bigint } | undefined>(
    undefined
  )
  const tokenKey = fromToken ? getTokenKey(fromToken) : undefined

  // Ref writes happen post-commit (never during render — Strict Mode /
  // concurrent renders may be replayed or discarded). A stale entry from a
  // previous token needs no eager clearing: the read below only honors an
  // entry whose tokenKey matches the current token.
  useEffect(() => {
    if (max !== undefined && tokenKey !== undefined) {
      lastKnownRef.current = { tokenKey, value: max }
    }
  }, [max, tokenKey])

  if (max !== undefined) return max
  const lastKnown = lastKnownRef.current
  return shouldHold &&
    lastKnown !== undefined &&
    lastKnown.tokenKey === tokenKey
    ? lastKnown.value
    : undefined
}

/**
 * Returns the maximum amount the user can swap from their balance.
 *
 * Fetches a pre-quote to estimate fees before the user has entered an amount.
 * All additive fees denominated in the source token (fundingModel === 'additive',
 * matching token type and address) are summed and buffered by a route-based
 * safety margin from feature flags.
 *
 * For native tokens, buffered gas is also subtracted.
 * For non-native tokens (ERC20/SPL), gas is paid in the native asset so only additive fees
 * in the source token are deducted.
 *
 * Returns undefined while the pre-quote or gas estimate is loading so the Max
 * button stays disabled until the correct value is known.
 */
export const useMaxSwapAmount = ({
  fromToken,
  toToken,
  minimumTransferAmount
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  minimumTransferAmount: bigint | null | undefined
}): {
  max: bigint | undefined
  /**
   * True while an async input the max depends on is still pending (the
   * dust-filtered X/P spendable balance, the gas estimate for native sources,
   * or the pre-quote's additive fee for ERC20/SPL sources). Lets the UI tell
   * a *calculating* `max === undefined` apart from a *terminal* one (fees
   * exceed the balance), which never resolves.
   */
  isMaxLoading: boolean
  rawAdditiveFee: bigint
  bufferedAdditiveFee: bigint
  routeAdditiveBps: number
  rawGasFee: bigint | undefined
  bufferedGasFee: bigint | undefined
  gasSafetyBps: number
  rawNativeAdditiveFee: bigint
  bufferedNativeAdditiveFee: bigint
} => {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const { getNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const maxAmountGasSafetyBps = useSelector(selectFusionMaxAmountGasSafetyBps)
  const additiveBpsDefault = useSelector(
    selectFusionMaxAmountAdditiveBpsDefault
  )
  const additiveBpsEvmToSolana = useSelector(
    selectFusionMaxAmountAdditiveBpsEvmToSolana
  )
  const additiveBpsSolanaToEvm = useSelector(
    selectFusionMaxAmountAdditiveBpsSolanaToEvm
  )

  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )
  const toNetwork = useMemo(
    () => (toToken ? getNetwork(toToken.networkChainId) : undefined),
    [toToken, getNetwork]
  )
  const fromAddress = useMemo(
    () =>
      activeAccount && fromNetwork
        ? getAddressByNetwork(activeAccount, fromNetwork)
        : undefined,
    [activeAccount, fromNetwork]
  )
  const toAddress = useMemo(
    () =>
      activeAccount && toNetwork
        ? getAddressByNetwork(activeAccount, toNetwork)
        : undefined,
    [activeAccount, toNetwork]
  )

  const isNative = fromToken?.type === TokenType.NATIVE

  const preQuoteAmount = useMemo(
    () => getPreQuoteAmount(minimumTransferAmount, fromToken),
    [minimumTransferAmount, fromToken]
  )

  const { quote: preQuote, failed: preQuoteFailed } = usePreQuote({
    isFusionServiceReady,
    fromToken,
    toToken,
    fromNetwork,
    toNetwork,
    fromAddress,
    toAddress,
    minimumTransferAmount: preQuoteAmount
  })

  const routeAdditiveBps = getRouteAdditiveBps(
    fromNetwork?.caip2ChainId,
    toNetwork?.caip2ChainId,
    {
      default: additiveBpsDefault,
      evmToSolana: additiveBpsEvmToSolana,
      solanaToEvm: additiveBpsSolanaToEvm
    }
  )

  // All additive fees in the source token, with a uniform route-based buffer.
  const additiveFeeResult = useMemo(
    () => getTotalAdditiveSourceFee(fromToken, preQuote, routeAdditiveBps),
    [fromToken, preQuote, routeAdditiveBps]
  )
  const bufferedAdditiveFee = additiveFeeResult.buffered
  const rawAdditiveFee = additiveFeeResult.raw

  // Additive fees denominated in the native asset (e.g. CCIP bridge fee in AVAX)
  const nativeAdditiveFeeResult = useMemo(
    () => getTotalAdditiveNativeFee(fromToken, preQuote, routeAdditiveBps),
    [fromToken, preQuote, routeAdditiveBps]
  )
  const bufferedNativeAdditiveFee = nativeAdditiveFeeResult.buffered
  const rawNativeAdditiveFee = nativeAdditiveFeeResult.raw

  const {
    gasFee: bufferedFee,
    rawGasFee,
    error: feeEstimationError,
    isFetching: isFeeEstimationFetching
  } = useFeeEstimation({
    quote: preQuote,
    fromNetwork,
    gasSafetyBps: maxAmountGasSafetyBps
  })

  const additiveFeeForMax = resolveAdditiveFeeForMax(
    preQuoteFailed,
    preQuote !== null,
    bufferedAdditiveFee
  )

  const {
    spendableBalance,
    isSpendableBalanceRequired,
    hasSpendableBalanceError
  } = useSpendableXpBalance({ fromToken, fromNetwork })

  const hasEstimationError =
    (!!feeEstimationError && !isFeeEstimationFetching) || preQuoteFailed

  const isMaxLoading = computeIsMaxLoading({
    fromToken,
    isNative,
    bufferedGas: bufferedFee,
    additiveFee: additiveFeeForMax,
    hasEstimationError,
    isSpendableBalanceRequired,
    spendableBalance,
    hasSpendableBalanceError
  })

  const isSpendableBalancePending =
    isSpendableBalanceRequired && spendableBalance === undefined

  const computedMax = useMemo(() => {
    // CP-13903: a native X/P Max must come from the dust-filtered UTXO set
    // the CCT callbacks spend. Until it loads, keep Max disabled — falling
    // back to the displayed balance could build an over-spend.
    if (isSpendableBalancePending) {
      return undefined
    }
    return computeMaxAmount({
      fromToken,
      isNative,
      bufferedGas: bufferedFee,
      additiveFee: additiveFeeForMax,
      hasEstimationError,
      spendableBalance: isSpendableBalanceRequired
        ? spendableBalance
        : undefined
    })
  }, [
    fromToken,
    isNative,
    bufferedFee,
    additiveFeeForMax,
    hasEstimationError,
    isSpendableBalanceRequired,
    isSpendableBalancePending,
    spendableBalance
  ])

  // Hold the last known max through pre-quote / gas-estimate refreshes so the
  // Max button doesn't drop into its disabled look on every quote cycle. The
  // spendable-balance refetch is deliberately NOT held (CP-13903 — see the
  // hook doc). Pressing Max still goes through live fee validation, so a
  // briefly-stale value can't submit an over-drawn amount.
  const max = useHoldMaxWhileRecalculating({
    max: computedMax,
    fromToken,
    shouldHold: isMaxLoading && !isSpendableBalancePending
  })

  return {
    max,
    isMaxLoading,
    rawAdditiveFee,
    bufferedAdditiveFee,
    routeAdditiveBps,
    rawGasFee,
    bufferedGasFee: bufferedFee,
    gasSafetyBps: maxAmountGasSafetyBps,
    rawNativeAdditiveFee,
    bufferedNativeAdditiveFee
  }
}
