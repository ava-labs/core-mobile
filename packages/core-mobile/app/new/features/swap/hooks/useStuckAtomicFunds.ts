import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { getAvaxAssetId } from 'services/wallet/utils'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  mapAtomicUtxosToRoutes,
  type StuckRoute
} from '../utils/stuckFundsRoutes'

// Poll while the banner is on-screen so a route stranded during the session
// surfaces without the user backgrounding/navigating. Safe to poll because
// detection is read-only (never prompts the device); paused in the background.
const STUCK_ATOMIC_FUNDS_REFETCH_INTERVAL = 60_000

/**
 * Detects AVAX stranded in atomic memory after an incomplete cross-chain
 * transfer, across all six CCT routes. Read-only (never prompts the device),
 * so it polls on a 60s interval (foreground only) plus the app's normal
 * mount/foreground refresh. Call `invalidate` after a recovery completes to
 * clear a recovered route.
 */
export const useStuckAtomicFunds = (): {
  routes: StuckRoute[]
  totalNAvax: bigint
  hasAnyAtomics: boolean
  invalidate: () => void
} => {
  const account = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { xpAddresses } = useXPAddresses(account)
  const queryClient = useQueryClient()

  const { data: routes = [] } = useQuery({
    queryKey: [
      ReactQueryKeys.FUSION_STUCK_ATOMIC_FUNDS,
      account,
      isDeveloperMode,
      xpAddresses
    ],
    enabled: !!account && xpAddresses.length > 0,
    refetchInterval: STUCK_ATOMIC_FUNDS_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      if (!account) return []
      return AvalancheWalletService.getAllAtomicUTXOs({
        account,
        isTestnet: isDeveloperMode,
        xpAddresses
      })
    },
    select: raw => mapAtomicUtxosToRoutes(raw, getAvaxAssetId(isDeveloperMode))
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.FUSION_STUCK_ATOMIC_FUNDS]
    })
  }, [queryClient])

  return {
    routes,
    totalNAvax: routes.reduce((acc, r) => acc + r.amountNAvax, 0n),
    hasAnyAtomics: routes.length > 0,
    invalidate
  }
}
