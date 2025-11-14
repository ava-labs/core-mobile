import { useMemo } from 'react'
import { Account } from 'store/account/types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns token balances for a specific account + network (chainId).
 * Returns [] if data not yet available or if no account or chainId is provided.
 */
export function useTokensWithBalanceByNetworkForAccount(
  account?: Account,
  chainId?: number
): LocalTokenWithBalance[] {
  const { data } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account || !chainId) return []

    // Find cached balance entry for this chain
    const balanceForNetwork = data.find(
      balance => balance.accountId === account.id && balance.chainId === chainId
    )

    // Return tokens for that network, or [] if not found
    return balanceForNetwork?.tokens ?? []
  }, [account, chainId, data])
}
