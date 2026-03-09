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
    return {
      tokens: [...fromTokens.tokens, ...toTokens.tokens],
      isLoading: fromTokens.isLoading || toTokens.isLoading,
      error: fromTokens.error || toTokens.error
    }
  }, [fromTokens, toTokens])
}
