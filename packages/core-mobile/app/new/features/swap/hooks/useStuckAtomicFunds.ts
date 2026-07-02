import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsFusionAvalancheCctEnabled } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { getAvaxAssetId } from 'services/wallet/utils'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  mapAtomicUtxosToRoutes,
  type StuckRoute
} from '../utils/stuckFundsRoutes'
import { useIsFusionServiceReady } from './useZustandStore'

/**
 * Invalidates the stuck-atomic-funds query. A plain function (uses the app's
 * singleton queryClient) so callers that only need to refresh detection — e.g.
 * after a recovery completes — don't have to subscribe to the polling query
 * (which would register a second useQuery consumer / refetch-interval).
 */
export const invalidateStuckAtomicFunds = (): void => {
  queryClient.invalidateQueries({
    queryKey: [ReactQueryKeys.FUSION_STUCK_ATOMIC_FUNDS]
  })
}

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
  const isAvalancheCctEnabled = useSelector(selectIsFusionAvalancheCctEnabled)
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const { xpAddresses } = useXPAddresses(account)

  const { data: routes = [] } = useQuery({
    // account.id is the stable identity for the key; the queryFn reads the whole
    // account object, but its atomic-UTXO inputs are the id + xpAddresses (both keyed).
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.FUSION_STUCK_ATOMIC_FUNDS,
      account?.id,
      isDeveloperMode,
      xpAddresses
    ],
    // Gate detection on the CCT flag (the feature's kill switch, stops the
    // 6-RPC/60s poll for every XP user when CCT recovery isn't enabled) and on
    // Fusion readiness, since the banner is hidden until Fusion is ready anyway
    // — no point polling during the post-unlock init window.
    enabled:
      isAvalancheCctEnabled &&
      isFusionServiceReady &&
      !!account &&
      xpAddresses.length > 0,
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

  return {
    routes,
    totalNAvax: routes.reduce((acc, r) => acc + r.amountNAvax, 0n),
    hasAnyAtomics: routes.length > 0,
    invalidate: invalidateStuckAtomicFunds
  }
}
