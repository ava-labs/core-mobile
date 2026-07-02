import { skipToken, useQuery } from '@tanstack/react-query'
import type { Caip2ChainId, ServiceType } from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { LocalTokenWithBalance } from 'store/balance'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import FusionService from '../services/FusionService'
import { logSdkError } from '../utils/fusionLogger'
import { toSwappableAsset } from '../utils/fusionTypeConverters'
import { getTokenKey } from '../utils/tokenKey'
import { useIsFusionServiceReady } from './useZustandStore'

const fetchMinimumTransferAmount = async (
  fromToken: LocalTokenWithBalance,
  toToken: LocalTokenWithBalance,
  serviceType?: ServiceType
): Promise<bigint | null> => {
  try {
    const result = await FusionService.getMinimumTransferAmount({
      sourceAsset: toSwappableAsset(fromToken),
      sourceChainId: getCaip2ChainId(fromToken.networkChainId) as Caip2ChainId,
      targetAsset: toSwappableAsset(toToken),
      targetChainId: getCaip2ChainId(toToken.networkChainId) as Caip2ChainId
    })

    if (!result) return null

    // When a specific service is requested, pin its floor. Recurring swaps are
    // Markr-only, so blending in a lower non-Markr floor (e.g. the gas-based
    // avalanche-evm one) would under-floor the per-order amount and let a
    // sub-fillable schedule through — the Markr fee/decimals floor is the
    // relevant one. Returns null when that service doesn't support the route.
    if (serviceType) return result[serviceType] ?? null

    const values = Object.values(result).filter(v => v !== undefined)

    // Return the lowest minimum — most permissive service wins
    let minimum: bigint | undefined
    for (const v of values) {
      if (minimum === undefined || v < minimum) minimum = v
    }
    return minimum ?? null
  } catch (error) {
    logSdkError(
      '[useMinimumTransferAmount] getMinimumTransferAmount error',
      error
    )
    return null
  }
}

export const useMinimumTransferAmount = ({
  fromToken,
  toToken,
  serviceType
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  // When set, return that service's minimum instead of the lowest across all
  // services. Used by the recurring path to pin the Markr floor.
  serviceType?: ServiceType
}): bigint | null | undefined => {
  const [isFusionServiceReady] = useIsFusionServiceReady()

  const { data } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_MINIMUM_TRANSFER_AMOUNT,
      fromToken ? getTokenKey(fromToken) : undefined,
      toToken ? getTokenKey(toToken) : undefined,
      serviceType
    ],
    queryFn:
      isFusionServiceReady && fromToken && toToken
        ? () => fetchMinimumTransferAmount(fromToken, toToken, serviceType)
        : skipToken,
    staleTime: 30_000
  })

  // undefined = still loading;
  // null = settled but unavailable;
  // bigint = ready
  return data
}
