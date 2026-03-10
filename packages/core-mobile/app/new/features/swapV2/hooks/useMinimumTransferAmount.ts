import { skipToken, useQuery } from '@tanstack/react-query'
import type { Caip2ChainId } from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { LocalTokenWithBalance } from 'store/balance'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import FusionService from '../services/FusionService'
import { logSdkError } from '../utils/fusionLogger'
import { toSwappableAsset } from '../utils/fusionTypeConverters'
import { useIsFusionServiceReady } from './useZustandStore'

const fetchMinimumTransferAmount = async (
  fromToken: LocalTokenWithBalance,
  toToken: LocalTokenWithBalance
): Promise<bigint | null> => {
  try {
    const result = await FusionService.getMinimumTransferAmount({
      sourceAsset: toSwappableAsset(fromToken),
      sourceChainId: getCaip2ChainId(fromToken.networkChainId) as Caip2ChainId,
      targetAsset: toSwappableAsset(toToken),
      targetChainId: getCaip2ChainId(toToken.networkChainId) as Caip2ChainId
    })

    if (!result) return null

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
  toToken
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
}): bigint | null => {
  const [isFusionServiceReady] = useIsFusionServiceReady()

  const { data } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_MINIMUM_TRANSFER_AMOUNT,
      fromToken?.localId,
      toToken?.localId
    ],
    queryFn:
      isFusionServiceReady && fromToken && toToken
        ? () => fetchMinimumTransferAmount(fromToken, toToken)
        : skipToken,
    staleTime: 30_000
  })

  return data ?? null
}
