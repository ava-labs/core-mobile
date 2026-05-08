import { skipToken, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectFusionFeeUnitsMarginBps } from 'store/posthog'
import type { NetworkWithCaip2ChainId } from 'store/network'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { isEstimateNativeFeeError } from '@avalabs/fusion-sdk'
import Logger from 'utils/Logger'
import SentryService from 'services/sentry/SentryService'
import { SentryTag } from 'services/sentry/types'
import FusionService from '../services/FusionService'
import { logSdkError } from '../utils/fusionLogger'
import type { Quote } from '../types'
import {
  getFingerprintForFeeEstimationError,
  isQuoteUsable
} from './useFeeEstimation.helpers'
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
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_SWAP_FEE_ESTIMATE,
      quote?.id,
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
    if (isEstimateNativeFeeError(error) && error.details) {
      Logger.warn('[useFeeEstimation] estimateNativeFee revert error', error)
      // Use captureMessage (not Logger.error) for Sentry so that BigInt values
      // in error.details.args are serialized to strings by sanitizeContext.
      SentryService.captureMessage(
        '[useFeeEstimation] estimateNativeFee revert error',
        { ...error.details, cause: error.cause },
        { source: SentryTag.FusionSdk },
        getFingerprintForFeeEstimationError(error)
      )
    } else {
      logSdkError('[useFeeEstimation] estimateNativeFee error', error)
    }
  }, [error])

  return {
    gasFee: data?.buffered,
    rawGasFee: data?.raw,
    error,
    isFetching
  }
}
