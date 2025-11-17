import { QueryObserverResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectAllCustomTokens } from 'store/customToken'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Wallet } from 'store/wallet/types'
import { selectAccountsByWalletId } from 'store/account'
import { RootState } from 'store/types'
import BalanceService from 'services/balance/BalanceService'
import { NormalizedBalancesForAccount } from 'services/balance/types'

export const balanceKey = (wallet: Wallet | undefined) =>
  [ReactQueryKeys.WALLET_BALANCE, wallet?.id] as const

/**
 * Stale time in milliseconds
 */
const staleTime = 30_000

type AccountId = string

/**
 * Fetches balances for all accounts within a wallet across all enabled networks (C-Chain, X-Chain, P-Chain, other EVMs, BTC, SOL, etc.)
 *
 * 🔁 Runs one query for all enabled networks via React Query.
 */
export function useWalletBalances(
  wallet?: Wallet
): QueryObserverResult<
  Record<AccountId, NormalizedBalancesForAccount[]>,
  Error
> {
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const customTokens = useSelector(selectAllCustomTokens)
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )

  const isNotReady =
    !wallet || accounts.length === 0 || enabledNetworks.length === 0

  const enabled = !isNotReady

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balanceKey(wallet),
    enabled,
    staleTime,
    queryFn: async () => {
      if (isNotReady) return {}

      return BalanceService.getBalancesForAccounts({
        networks: enabledNetworks,
        accounts,
        currency: currency.toLowerCase(),
        customTokens
      })
    }
  })
}
