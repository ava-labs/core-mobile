import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { isTokenVisible } from 'store/balance/utils'
import { Account } from 'store/account/types'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'

/**
 * Returns the total on-chain balance (sum of `token.balance`, in subunits)
 * across all visible and enabled tokens for the given account.
 */
export function useBalanceTotalForAccount(account?: Account): bigint {
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const tokens = useTokensWithBalanceForAccount({ account })

  return useMemo(() => {
    if (!account) return 0n

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balance ?? 0n), 0n)
  }, [tokens, tokenVisibility, enabledChainIds, account])
}
