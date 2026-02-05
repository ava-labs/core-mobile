import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useMemo, useRef } from 'react'
import { LocalTokenWithBalance } from 'store/balance/types'

type UseTokenWithFallbackParams = {
  tokens: NetworkContractToken[] | undefined
  localId: string | undefined
  chainId: string | undefined
}

type UseTokenWithFallbackResult = {
  token: LocalTokenWithBalance | undefined
  hasSeenToken: boolean
}

/**
 * Hook to find a token from filtered lists with fallback to zero balance list.
 * This handles the case where a user sends their entire balance (max) and
 * returns to the token details page - the token should still be visible
 * even with zero balance.
 */
export function useTokenWithFallback({
  tokens,
  localId,
  chainId
}: UseTokenWithFallbackParams): UseTokenWithFallbackResult {
  const { filteredTokenList } = useSearchableTokenList({
    tokens
  })

  // Get list including zero balance tokens as fallback for when user sends max balance
  const { filteredTokenList: filteredTokenListWithZeroBalance } =
    useSearchableTokenList({
      tokens,
      hideZeroBalance: false
    })

  // Track if we've ever seen the token to handle zero balance after sending max
  const hasSeenTokenRef = useRef(false)

  const token = useMemo(() => {
    // First try to find token with balance
    const tokenWithBalance = filteredTokenList.find(
      tk => tk.localId === localId && tk.networkChainId === Number(chainId)
    )

    if (tokenWithBalance) {
      return tokenWithBalance
    }

    // If we've seen the token before, fall back to zero balance list
    // This handles the case where user sent max balance
    if (hasSeenTokenRef.current) {
      return filteredTokenListWithZeroBalance.find(
        tk => tk.localId === localId && tk.networkChainId === Number(chainId)
      )
    }

    return undefined
  }, [chainId, filteredTokenList, filteredTokenListWithZeroBalance, localId])

  // Update ref after token is resolved
  if (token !== undefined) {
    hasSeenTokenRef.current = true
  }

  return {
    token,
    hasSeenToken: hasSeenTokenRef.current
  }
}
