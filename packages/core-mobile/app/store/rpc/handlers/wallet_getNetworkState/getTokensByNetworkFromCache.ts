import { Account } from 'store/account/types'
import { TokenVisibility } from 'store/portfolio/types'
import { isTokenVisible } from 'store/balance/utils'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Network } from '@avalabs/core-chains-sdk'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { balanceKey } from 'features/portfolio/hooks/useAccountBalances'

/**
 * Retrieves enabled and disabled token addresses for a given network
 * from the React Query cache (no network requests).
 */
export function getTokensByNetworkFromCache({
  account,
  network,
  tokenVisibility
}: {
  account?: Account
  network?: Network
  tokenVisibility: TokenVisibility
}): {
  enabledTokens: string[]
  disabledTokens: string[]
} {
  if (!account || !network) {
    return { enabledTokens: [], disabledTokens: [] }
  }

  const cachedData = queryClient.getQueryData(balanceKey(account, network)) as
    | NormalizedBalancesForAccount
    | undefined

  const tokens = cachedData?.tokens ?? []
  const enabled: string[] = []
  const disabled: string[] = []

  tokens.forEach(token => {
    if ('address' in token && token.address) {
      if (isTokenVisible(tokenVisibility, token)) {
        enabled.push(token.address)
      } else {
        disabled.push(token.address)
      }
    }
  })

  return { enabledTokens: enabled, disabledTokens: disabled }
}
