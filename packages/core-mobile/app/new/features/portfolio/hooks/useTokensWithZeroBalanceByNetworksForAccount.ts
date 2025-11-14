import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { LocalTokenWithBalance } from 'store/balance/types'

/**
 * Returns all tokens with a zero balance for the specified networks.
 */
export function useTokensWithZeroBalanceByNetworksForAccount(
  account?: Account,
  chainIds?: number[]
): LocalTokenWithBalance[] {
  const { data } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account || !chainIds || chainIds.length === 0) return []

    const zeroBalanceTokens: LocalTokenWithBalance[] = []

    for (const chainId of chainIds) {
      const networkBalance = data.find(
        b => b.accountId === account.id && b.chainId === chainId
      )

      if (networkBalance?.tokens?.length) {
        zeroBalanceTokens.push(
          ...networkBalance.tokens.filter(t => t.balance === 0n)
        )
      }
    }

    return zeroBalanceTokens
  }, [account, chainIds, data])
}
