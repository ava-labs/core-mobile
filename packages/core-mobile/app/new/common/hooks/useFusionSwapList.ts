import { LocalTokenWithBalance } from 'store/balance/types'
import { useSwapTokens } from 'features/swapV2/hooks/useSwapTokens'
import { useMemo } from 'react'

export const useFusionSwapList = ({
  fromCaip2Id,
  toCaip2Id
}: {
  fromCaip2Id?: string
  toCaip2Id?: string
}): {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
  error: Error | null
} => {
  const fromTokens = useSwapTokens(fromCaip2Id ?? '')
  const toTokens = useSwapTokens(toCaip2Id ?? '')

  return useMemo(() => {
    const seen = new Set<string>()
    const tokens = [...fromTokens.tokens, ...toTokens.tokens].filter(t => {
      // using networkChainId + localId as a unique key to filter duplicates across from/to lists
      // internalId is optional and may not be present for all tokens, so we fall back to caip2Id + address if internalId is missing
      const key = `${t.networkChainId}:${t.localId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return {
      tokens,
      isLoading: fromTokens.isLoading || toTokens.isLoading,
      error: fromTokens.error || toTokens.error
    }
  }, [fromTokens, toTokens])
}
