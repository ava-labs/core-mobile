import type { UserAbstractionMode } from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { usePerps } from '../contexts/PerpsProvider'

/** 30s — abstraction mode changes only via an explicit user-signed action. */
const STALE_TIME_MS = 30 * 1000

/**
 * Hyperliquid account abstraction mode for the active wallet. `undefined` while
 * loading or if the request fails. Re-fetches when the shared clearinghouse
 * refresh nonce bumps (e.g. after enabling unified account).
 */
export function useUserAbstraction(): UserAbstractionMode | undefined {
  const { manager, userAddress, clearinghouseRefreshNonce } = usePerps()

  const query = useQuery({
    queryKey: [
      ReactQueryKeys.PERPS_USER_ABSTRACTION,
      userAddress,
      clearinghouseRefreshNonce
    ],
    enabled: manager !== null && userAddress !== undefined,
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<UserAbstractionMode> => {
      if (manager === null || userAddress === undefined) {
        throw new Error('Prerequisites missing')
      }
      return manager.info.getUserAbstraction(userAddress)
    }
  })

  return query.data
}
