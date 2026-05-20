import { isDefined } from 'common/utils/isDefined'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { isTokenVisible } from 'store/balance/utils'
import { Networks } from 'store/network/types'
import { TokenVisibility } from 'store/portfolio'

export interface AccountBalanceData {
  balance: number
  isLoadingBalance: boolean
  hasBalanceData: boolean
  dataAccurate: boolean
  error: string | null
}

/**
 * Pure function that computes balance data for a single account.
 * No hooks — safe to call in a loop or inside useMemo.
 *
 * `enabledNetworksCount` is the number of enabled networks for which this
 * specific account can produce balance entries (computed via
 * `getEnabledNetworksForAccount`). Using a per-account count is required so
 * that wallets which cannot derive an address for every globally-enabled
 * network (e.g. Keystone for Solana) don't get stuck on an infinite spinner
 * waiting for balance entries that will never arrive — see CP-14303.
 */
export function computeAccountBalance({
  accountBalances,
  enabledNetworksCount,
  enabledNetworksMap,
  enabledChainIds,
  isDeveloperMode,
  tokenVisibility,
  isError
}: {
  accountBalances: AdjustedNormalizedBalancesForAccount[]
  enabledNetworksCount: number
  enabledNetworksMap: Networks
  enabledChainIds: number[]
  isDeveloperMode: boolean
  tokenVisibility: TokenVisibility
  isError: boolean
}): AccountBalanceData {
  const isLoadingBalance = isError
    ? false
    : enabledNetworksCount === 0
    ? false
    : accountBalances.length < enabledNetworksCount

  const hasBalanceData = accountBalances.length > 0

  const dataAccurate = accountBalances.every(b => b.dataAccurate)

  const error = accountBalances.find(b => b.error)?.error?.error ?? null

  const filteredBalances = accountBalances.filter(isDefined).filter(b => {
    const network = enabledNetworksMap[b.chainId]
    const isTestnet = network?.isTestnet
    return (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
  })

  const balance = filteredBalances
    .flatMap(b => b.tokens)
    .filter(
      token =>
        // @ts-ignore -- type mismatch pending backend balance type migration
        isTokenVisible(tokenVisibility, token) &&
        enabledChainIds.includes(token.networkChainId)
    )
    .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)

  return { balance, isLoadingBalance, hasBalanceData, dataAccurate, error }
}
