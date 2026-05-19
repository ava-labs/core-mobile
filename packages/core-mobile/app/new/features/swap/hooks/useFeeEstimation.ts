import { skipToken, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectFusionFeeUnitsMarginBps } from 'store/posthog'
import type { NetworkWithCaip2ChainId } from 'store/network'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { isEstimateNativeFeeError } from '@avalabs/fusion-sdk'
import * as Sentry from '@sentry/react-native'
import Logger from 'utils/Logger'
import SentryService from 'services/sentry/SentryService'
import { buildSentryFingerprint } from 'services/sentry/fingerprint'
import {
  AllowedSentryBreadcrumbCategory,
  SentryTag
} from 'services/sentry/types'
import FusionService from '../services/FusionService'
import { logSdkError } from '../utils/fusionLogger'
import type { Quote } from '../types'
import { isQuoteUsable, isUserStateError } from './useFeeEstimation.helpers'
import { buildFeeOptions } from './useMaxSwapAmount/utils'

/**
 * Estimates the native gas fee for executing a given quote.
 *
 * Optionally applies an additional safety buffer via gasSafetyBps (basis
 * points). Use gasSafetyBps for the Max button (needs extra headroom); omit it
 * for balance validation (standard estimate is sufficient).
 *
 * Returns gasFee as undefined while the estimate is loading.
 */
export const useFeeEstimation = ({
  quote,
  fromNetwork,
  gasSafetyBps = 0
}: {
  quote: Quote | null
  fromNetwork?: NetworkWithCaip2ChainId
  gasSafetyBps?: number
}): {
  gasFee: bigint | undefined
  rawGasFee: bigint | undefined
  error: unknown
  isFetching: boolean
} => {
  const feeUnitsMarginBps = useSelector(selectFusionFeeUnitsMarginBps)
  const { data: networkFee } = useNetworkFee(fromNetwork)

  const feeOptions = useMemo(
    () => buildFeeOptions(feeUnitsMarginBps, networkFee),
    [feeUnitsMarginBps, networkFee]
  )

  // Capture the usable quote up-front so the queryFn closure can rely on
  // narrowing without a runtime re-check. TanStack v5 invokes the latest
  // queryFn from the most recent `setOptions`, so each render's closure
  // sees that render's `usableQuote`. Re-checking inside the closure would
  // require returning `undefined` on the stale path, which v5 rejects with
  // "data cannot be undefined" and would re-introduce the double-capture
  // this guard is meant to eliminate.
  const usableQuote = isQuoteUsable(quote) ? quote : null

  const { data, error, isFetching } = useQuery({
    // Key on `usableQuote?.id` (not `quote?.id`) so the cache identity
    // tracks usability: when a quote expires, the key flips to one with
    // `undefined` in the id slot — a key that has never been fetched, so
    // `data` is `undefined` instead of the previously-cached fee estimate.
    // Without this, the queryFn would correctly switch to `skipToken` but
    // React Query would still surface the cached `data` under the old key,
    // and downstream consumers (`useFeeValidation`, `useMaxSwapAmount`)
    // would validate against a stale estimate during the window between
    // expiry and the next quote-stream push.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_SWAP_FEE_ESTIMATE,
      usableQuote?.id,
      feeOptions.feeUnitsMarginBps,
      feeOptions.overrides?.maxFeePerGas.toString(),
      feeOptions.overrides?.maxPriorityFeePerGas.toString(),
      gasSafetyBps
    ],
    queryFn: usableQuote
      ? async () => {
          const { totalFee, totalFeeWithoutMargin } =
            await FusionService.estimateNativeFee(usableQuote, feeOptions)
          const buffered =
            gasSafetyBps > 0
              ? (totalFee * (10000n + BigInt(gasSafetyBps))) / 10000n
              : totalFee
          return { raw: totalFeeWithoutMargin, buffered }
        }
      : skipToken,
    staleTime: 0,
    retry: false
  })

  useEffect(() => {
    if (!error) return

    // Suppress capture for known user-state errors (insufficient native AVAX,
    // insufficient ERC20 balance/allowance). The UI already surfaces these via
    // `useFeeValidation → canSwap`; Sentry doesn't add value and the noise
    // dominates the swap-feature issue list when not filtered. We still leave
    // a breadcrumb so investigators retain forensic context if a downstream
    // (non-suppressed) error fires later in the same session.
    if (isUserStateError(error)) {
      Sentry.addBreadcrumb({
        category: AllowedSentryBreadcrumbCategory.FeeEstimationUserState,
        level: 'info',
        message: '[useFeeEstimation] skipped user-state error'
      })
      return
    }

    if (isEstimateNativeFeeError(error) && error.details) {
      Logger.warn('[useFeeEstimation] estimateNativeFee revert error', error)
      // Use captureMessage (not Logger.error) for Sentry so that BigInt values
      // in error.details.args are serialized to strings by sanitizeContext.
      SentryService.captureMessage(
        '[useFeeEstimation] estimateNativeFee revert error',
        { ...error.details, cause: error.cause },
        { source: SentryTag.FusionSdk },
        buildSentryFingerprint('useFeeEstimation', error.details.data)
      )
    } else {
      logSdkError('[useFeeEstimation] estimateNativeFee error', error)
    }
  }, [error])

  // Belt-and-suspenders on top of the `usableQuote?.id` queryKey: even if a
  // future TanStack option (placeholderData, keepPreviousData) ever surfaces
  // cross-key data, gating the return on `usableQuote` keeps downstream
  // consumers (`useFeeValidation`, `useMaxSwapAmount`) from validating /
  // computing Max against a stale estimate. Returning `undefined` matches
  // the existing "fee unavailable" semantics for the loading state.
  return {
    gasFee: usableQuote ? data?.buffered : undefined,
    rawGasFee: usableQuote ? data?.raw : undefined,
    error,
    isFetching
  }
}
