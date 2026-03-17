import { skipToken, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectFusionFeeUnitsMarginBps } from 'store/posthog'
import type { NetworkWithCaip2ChainId } from 'store/network'
import { useNetworkFee } from 'hooks/useNetworkFee'
import FusionService from '../services/FusionService'
import { logSdkError } from '../utils/fusionLogger'
import type { Quote } from '../types'
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
}): { gasFee: bigint | undefined; error: unknown } => {
  const feeUnitsMarginBps = useSelector(selectFusionFeeUnitsMarginBps)
  const { data: networkFee } = useNetworkFee(fromNetwork)

  const feeOptions = useMemo(
    () => buildFeeOptions(feeUnitsMarginBps, networkFee),
    [feeUnitsMarginBps, networkFee]
  )

  const { data: gasFee, error } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_SWAP_FEE_ESTIMATE,
      quote?.id,
      feeOptions.feeUnitsMarginBps,
      gasSafetyBps
    ],
    queryFn: quote
      ? async () => {
          const { totalFee } = await FusionService.estimateNativeFee(
            quote,
            feeOptions
          )
          return gasSafetyBps > 0
            ? (totalFee * (10000n + BigInt(gasSafetyBps))) / 10000n
            : totalFee
        }
      : skipToken,
    staleTime: 0,
    retry: false
  })

  useEffect(() => {
    if (error) logSdkError('[useFeeEstimation] estimateNativeFee error', error)
  }, [error])

  return { gasFee, error }
}
