import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { useNetworks } from 'hooks/networks/useNetworks'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectEnabledChainIds } from 'store/network'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectWalletById } from 'store/wallet/slice'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import BalanceService from 'services/balance/BalanceService'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Returns token balances for the active account on the given chain.
 *
 * For enabled networks the result comes from the shared portfolio cache
 * (no extra fetch). For disabled networks a targeted balance fetch is
 * issued so that the swap TO-token selection screen can show real balances
 * even when the user has hidden that network.
 */
export const useSwapNetworkBalances = (
  chainId: number | undefined
): LocalTokenWithBalance[] => {
  const activeAccount = useSelector(selectActiveAccount)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const currency = useSelector(selectSelectedCurrency)
  const wallet = useSelector(selectWalletById(activeAccount?.walletId ?? ''))
  const { xpAddresses } = useXPAddresses(activeAccount)
  const { getNetwork } = useNetworks()

  const network = useMemo(
    () => (chainId ? getNetwork(chainId) : undefined),
    [chainId, getNetwork]
  )

  const isNetworkEnabled = useMemo(
    () => chainId !== undefined && enabledChainIds.includes(chainId),
    [chainId, enabledChainIds]
  )

  // Fast path: portfolio cache already has balances for enabled networks
  const cachedBalances = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    chainId
  )

  // Slow path: fetch balances directly for disabled networks
  const { data: fetchedBalances } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_SWAP_BALANCE,
      activeAccount?.id,
      activeAccount?.index,
      chainId,
      wallet?.id,
      wallet?.type,
      xpAddresses,
      currency
    ],
    queryFn: async () => {
      if (!activeAccount || !network || !wallet) return []

      const xpub = await getXpubXPIfAvailable({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: activeAccount.index
      })

      const results = await BalanceService.getBalancesForAccount({
        networks: [network],
        account: activeAccount,
        currency: currency.toLowerCase(),
        xpAddresses,
        xpub
      })

      return results[0]?.tokens ?? []
    },
    enabled: !isNetworkEnabled && !!activeAccount && !!network && !!wallet,
    staleTime: STALE_TIME
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return isNetworkEnabled ? cachedBalances : ((fetchedBalances ?? []) as any)
}
