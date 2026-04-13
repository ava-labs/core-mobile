import { useMemo } from 'react'
import { Account } from 'store/account/types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { useAccountBalances } from './useAccountBalances'

type Result = {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
}

/**
 * Returns token balances and loading state for a specific account + network (chainId).
 * Returns `{ tokens: [], isLoading }` if data not yet available or if no account or chainId is provided.
 */
export function useTokensWithBalanceByNetworkForAccount(
  account?: Account,
  chainId?: number
): Result {
  const { data, isLoading } = useAccountBalances(account)

  const tokens = useMemo(() => {
    if (!account || !chainId) return []

    // Find cached balance entry for this chain
    const balanceForNetwork = data.find(
      balance => balance.accountId === account.id && balance.chainId === chainId
    )

    // Return tokens for that network, or [] if not found
    return balanceForNetwork?.tokens ?? []
  }, [account, chainId, data])

  // TODO: fix type mismatch after fully migrating to the new backend balance types
  // @ts-ignore
  return { tokens, isLoading }
}
