import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworksMap } from 'store/network/slice'
import { Account } from 'store/account/types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isDefined } from 'new/common/utils/isDefined'
import { NormalizedBalancesForAccount } from 'services/balance/types'

/**
 * Returns token balances for a specific account from a source data
 * (Same as useTokensWithBalanceForAccount, but with a source data instead of useAccountBalances)
 */
export function useTokensWithBalanceForAccountFromSource({
  account,
  sourceData
}: {
  account?: Account
  sourceData: NormalizedBalancesForAccount[] | undefined
}): LocalTokenWithBalance[] {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const networks = useSelector(selectEnabledNetworksMap)

  return useMemo(() => {
    if (!account || !sourceData) return []

    const balancesForAccount = sourceData.filter(
      balance => balance.accountId === account.id
    )

    // Otherwise, return all tokens matching dev mode (mainnet/testnet)
    const filteredBalances = balancesForAccount
      .filter(isDefined)
      .filter(balance => {
        const network = networks[balance.chainId]
        const isTestnet = network?.isTestnet
        return (
          (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
        )
      })

    // Flatten all tokens into one array
    return filteredBalances.flatMap(balance => balance.tokens)
  }, [account, sourceData, networks, isDeveloperMode])
}
