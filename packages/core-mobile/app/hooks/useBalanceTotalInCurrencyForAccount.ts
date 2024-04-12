import { selectBalancesForAccount } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useNetworks } from './useNetworks'

export const useBalanceTotalInCurrencyForAccount = (
  accountIndex: number
): number => {
  const { getIsTestnet } = useNetworks()
  const balances = useSelector(selectBalancesForAccount(accountIndex))
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  let totalInCurrency = 0

  for (const balance of balances) {
    const isTestnet = getIsTestnet(balance.chainId)

    // when developer mode is on, only add testnet balances
    // when developer mode is off, only add mainnet balances
    if (
      (isDeveloperMode && isTestnet) ||
      (!isDeveloperMode && isTestnet === false)
    ) {
      for (const token of balance.tokens) {
        totalInCurrency += token.balanceInCurrency ?? 0
      }
    }
  }
  return totalInCurrency
}
