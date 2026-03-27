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
 * solanaToEvmFeeMultiplier: temporary workaround for the SDK under-reporting
 * fees on Solana→EVM routes. Multiplied into the raw fee before gasSafetyBps
 * is applied. Use 12 for validation, 15 for Max. No effect on other routes.
 *
 * Returns gasFee as undefined while the estimate is loading.
 */
export const useFeeEstimation = ({
  quote,
  fromNetwork,
  gasSafetyBps = 0,
  solanaToEvmFeeMultiplier = 1
}: {
  quote: Quote | null
  fromNetwork?: NetworkWithCaip2ChainId
  gasSafetyBps?: number
  /** Temporary workaround: SDK under-reports fees on Solana→EVM routes */
  solanaToEvmFeeMultiplier?: number
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

  const { data, error, isFetching } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_SWAP_FEE_ESTIMATE,
      quote?.id,
      feeOptions.feeUnitsMarginBps,
      gasSafetyBps,
      solanaToEvmFeeMultiplier
    ],
    queryFn: quote
      ? async () => {
          const { totalUpfrontFee } = await FusionService.estimateNativeFee(
            quote,
            feeOptions
          )
          const isSolanaToEvm =
            quote.sourceChain.chainId.startsWith('solana:') &&
            quote.targetChain.chainId.startsWith('eip155:')
          const adjustedFee =
            isSolanaToEvm && solanaToEvmFeeMultiplier > 1
              ? totalUpfrontFee * BigInt(solanaToEvmFeeMultiplier)
              : totalUpfrontFee
          const buffered =
            gasSafetyBps > 0
              ? (adjustedFee * (10000n + BigInt(gasSafetyBps))) / 10000n
              : adjustedFee
          return { raw: totalUpfrontFee, buffered }
        }
      : skipToken,
    staleTime: 0,
    retry: false
  })

  useEffect(() => {
    if (error) logSdkError('[useFeeEstimation] estimateNativeFee error', error)
  }, [error])

  return {
    gasFee: data?.buffered,
    rawGasFee: data?.raw,
    error,
    isFetching
  }
}
