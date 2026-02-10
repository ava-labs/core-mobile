import { Account } from 'store/account/types'
import { TokenVisibility } from 'store/portfolio/types'
import { isTokenVisible } from 'store/balance/utils'
import { Network } from '@avalabs/core-chains-sdk'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'

/**
 * Retrieves enabled and disabled token addresses for a given network
 * from the React Query cache (no network requests).
 */
export function getTokensByNetworkFromCache({
  account,
  network,
  tokenVisibility,
  cachedBalancesForAccount
}: {
  account?: Account
  network?: Network
  tokenVisibility: TokenVisibility
  cachedBalancesForAccount?: AdjustedNormalizedBalancesForAccount[]
}): {
  enabledTokens: string[]
  disabledTokens: string[]
} {
  if (!account || !network) {
    return { enabledTokens: [], disabledTokens: [] }
  }

  const balances = cachedBalancesForAccount?.find(
    balance => balance.chainId === network.chainId
  )

  const tokens = balances?.tokens ?? []
  const enabled: string[] = []
  const disabled: string[] = []

  tokens.forEach(token => {
    if (
      'address' in token &&
      typeof token.address === 'string' &&
      token.address
    ) {
      if (isTokenVisible(tokenVisibility, token)) {
        enabled.push(token.address)
      } else {
        disabled.push(token.address)
      }
    }
  })

  return { enabledTokens: enabled, disabledTokens: disabled }
}
