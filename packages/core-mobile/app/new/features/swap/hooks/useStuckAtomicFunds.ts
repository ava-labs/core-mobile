import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { getAvaxAssetId } from 'services/wallet/utils'
import {
  mapAtomicUtxosToRoutes,
  type StuckRoute
} from '../utils/stuckFundsRoutes'

export const STUCK_ATOMIC_FUNDS_KEY = 'stuckAtomicFunds'

/**
 * Detects AVAX stranded in atomic memory after an incomplete cross-chain
 * transfer, across all six CCT routes. Read-only (never prompts the device),
 * so it refreshes on the app's normal foreground cadence rather than polling.
 * Call `invalidate` after a recovery completes to clear a recovered route.
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
    queryKey: [STUCK_ATOMIC_FUNDS_KEY, account, isDeveloperMode, xpAddresses],
    enabled: !!account && xpAddresses.length > 0,
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
    queryClient.invalidateQueries({ queryKey: [STUCK_ATOMIC_FUNDS_KEY] })
  }, [queryClient])

  return {
    routes,
    totalNAvax: routes.reduce((acc, r) => acc + r.amountNAvax, 0n),
    hasAnyAtomics: routes.length > 0,
    invalidate
  }
}
