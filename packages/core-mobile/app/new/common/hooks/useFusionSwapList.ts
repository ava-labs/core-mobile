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
  const {
    tokens: fromTokensList,
    isLoading: fromIsLoading,
    error: fromError
  } = useSwapTokens(fromCaip2Id ?? '')
  const {
    tokens: toTokensList,
    isLoading: toIsLoading,
    error: toError
  } = useSwapTokens(toCaip2Id ?? '')

  return useMemo(() => {
    const seen = new Set<string>()
    const tokens = [...fromTokensList, ...toTokensList].filter(t => {
      // using networkChainId + localId (lowercased) as a unique key to deduplicate tokens
      // that appear in both from/to lists
      const key = `${t.networkChainId}:${t.localId.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return {
      tokens,
      isLoading: fromIsLoading || toIsLoading,
      error: fromError || toError
    }
  }, [
    fromTokensList,
    toTokensList,
    fromIsLoading,
    toIsLoading,
    fromError,
    toError
  ])
}
