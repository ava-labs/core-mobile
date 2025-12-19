import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { TokenType, TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useMemo } from 'react'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'

export const usePChainBalance = (): TokenWithBalancePVM | undefined => {
  const account = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const network = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || !network.chainId) return undefined

    // Find the balance entry for the requested network
    const balanceForNetworkAndAccount = data.find(
      balance =>
        balance.chainId === network.chainId && balance.accountId === account.id
    )

    if (!balanceForNetworkAndAccount) return undefined

    // Locate the native token
    const nativeToken = Object.values(
      balanceForNetworkAndAccount.tokens ?? []
    ).find(token => token.type === TokenType.NATIVE)

    if (!nativeToken) return undefined

    // Handle XP-style tokens (PVM/AVM)
    if (
      // TODO: fix type mismatch after fully migrating to the new backend balance types
      // @ts-ignore
      isTokenWithBalancePVM(nativeToken)
    ) {
      return nativeToken
    }

    throw new Error('Native token balance for p-chain not found')
  }, [account, network, data])
}
