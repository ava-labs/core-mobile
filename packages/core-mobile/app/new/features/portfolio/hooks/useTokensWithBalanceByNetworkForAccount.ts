import { useMemo } from 'react'
import { Account } from 'store/account/types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isDefined } from 'new/common/utils/isDefined'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns token balances for a specific account + network (chainId).
 * Returns [] if data not yet available or if no account or chainId is provided.
 */
export function useTokensWithBalanceByNetworkForAccount(
  account?: Account,
  chainId?: number
): LocalTokenWithBalance[] {
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account || !chainId) return []

    // Find cached balance entry for this chain
    const balanceForNetwork = results
      .map(result => result.data)
      .filter(isDefined)
      .find(
        balance =>
          balance.accountId === account.id && balance.chainId === chainId
      )

    // Return tokens for that network, or [] if not found
    return balanceForNetwork?.tokens ?? []
  }, [account, chainId, results])
}
