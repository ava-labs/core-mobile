import { useMemo } from 'react'
import { Account } from 'store/account/types'
import { TokenType } from '@avalabs/vm-module-types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns the available native token balance (in base units)
 * for a given account and network.
 *
 * - Handles both AVM/PVM tokens (returns `.available`) and EVM tokens (returns `.balance`).
 * - Returns `0n` if no matching token found or data not yet loaded.
 */
export function useAvailableNativeTokenBalanceForNetworkAndAccount(
  account?: Account,
  chainId?: number
): bigint {
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || !chainId) return 0n

    // Find the balance entry for the requested network
    const balanceForNetworkAndAccount = data.find(
      balance => balance.chainId === chainId && balance.accountId === account.id
    )

    if (!balanceForNetworkAndAccount) return 0n

    // Locate the native token
    const nativeToken = Object.values(
      balanceForNetworkAndAccount.tokens ?? []
    ).find(token => token.type === TokenType.NATIVE)

    if (!nativeToken) return 0n

    // Handle XP-style tokens (PVM/AVM)
    if (
      isTokenWithBalancePVM(nativeToken) ||
      isTokenWithBalanceAVM(nativeToken)
    ) {
      return nativeToken.available ?? 0n
    }

    return nativeToken.balance ?? 0n
  }, [account, chainId, data])
}
