import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import type { Account } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectFusionTransferGasMarginBps } from 'store/posthog'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { NetworkWithCaip2ChainId } from 'store/network'
import { getAvalancheChainId } from 'utils/caip2ChainIds'
import Logger from 'utils/Logger'
import { showSnackbar } from 'common/utils/toast'
import FusionService from '../services/FusionService'
import { toChain } from '../utils/fusionTypeConverters'
import { isUserRejectionError } from '../utils/fusionErrors'
import { aliasToCaip2, type StuckRoute } from '../utils/stuckFundsRoutes'
import { subscribeToFirstQuote } from '../utils/subscribeToFirstQuote'
import type { Quote } from '../types'
import type { QuoterParams } from '../services/types'
import { invalidateStuckAtomicFunds } from './useStuckAtomicFunds'

type GetNetwork = (chainId: number) => NetworkWithCaip2ChainId | undefined

// Backstop for a quote stream that never emits a terminal event: without it a
// stalled stream would leave every Recover button disabled until remount.
const RECOVERY_QUOTE_TIMEOUT_MS = 30_000

export const stuckRouteKey = (route: StuckRoute): string =>
  `${route.source}-${route.dest}`

const networkForAlias = (
  alias: StuckRoute['source'],
  isDeveloperMode: boolean,
  getNetwork: GetNetwork
): NetworkWithCaip2ChainId | undefined => {
  const chainId = getAvalancheChainId(aliasToCaip2(alias, isDeveloperMode))
  return chainId ? getNetwork(chainId) : undefined
}

/**
 * Resolves the Fusion quoter params for a recovery of `route`, or null if the
 * account/networks/addresses can't be resolved. AVAX is native, so both the
 * asset and chain come from the network's native token.
 */
const resolveRecoveryQuoterParams = ({
  route,
  account,
  isDeveloperMode,
  getNetwork
}: {
  route: StuckRoute
  account: Account | undefined
  isDeveloperMode: boolean
  getNetwork: GetNetwork
}): QuoterParams | null => {
  const sourceNetwork = networkForAlias(
    route.source,
    isDeveloperMode,
    getNetwork
  )
  const targetNetwork = networkForAlias(route.dest, isDeveloperMode, getNetwork)
  if (!account || !sourceNetwork || !targetNetwork) return null

  const fromAddress = getAddressByNetwork(account, sourceNetwork)
  const toAddress = getAddressByNetwork(account, targetNetwork)
  if (!fromAddress || !toAddress) return null

  const sourceChain = toChain(sourceNetwork)
  const targetChain = toChain(targetNetwork)
  return {
    fromAddress,
    toAddress,
    sourceAsset: sourceChain.networkToken,
    sourceChain,
    targetAsset: targetChain.networkToken,
    targetChain,
    amount: 0n,
    slippageBps: undefined
  }
}

/**
 * Recovers a stranded CCT route directly from the banner (no swap screen).
 * Mirrors web's Recover UX: builds an import-only recovery quote via the Fusion
 * SDK (`amountIn=0`, the flow the SDK author prescribed) and calls
 * `transferAsset`, which surfaces the standard CCT approval and broadcasts the
 * import. Detection is invalidated on success so the row clears.
 *
 * `recoveringKey` is the key (`source-dest`) of the route currently recovering,
 * or null — callers use it to show per-row progress and disable re-entry.
 */
export const useStuckFundsRecovery = (): {
  recover: (route: StuckRoute) => Promise<void>
  recoveringKey: string | null
} => {
  const account = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const transferGasMarginBps = useSelector(selectFusionTransferGasMarginBps)
  const { getNetwork } = useNetworks()
  const [recoveringKey, setRecoveringKey] = useState<string | null>(null)

  // Synchronous mutex: `recoveringKey` is captured per-render, so a rapid
  // double-tap could start a second recovery before the state update disables
  // the button. The ref guards that gap.
  const isRecoveringRef = useRef(false)
  // Cleanup for the in-flight quote subscription, torn down on unmount so the
  // quoter doesn't keep running (and settling against a dead hook) off-screen.
  const activeCleanupRef = useRef<(() => void) | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      activeCleanupRef.current?.()
      activeCleanupRef.current = null
    }
  }, [])

  const recover = useCallback(
    async (route: StuckRoute): Promise<void> => {
      if (isRecoveringRef.current) return
      isRecoveringRef.current = true

      // The banner only renders once Fusion is ready, so recovery is reachable
      // only in a usable state; any resolution failure surfaces via the catch.
      setRecoveringKey(stuckRouteKey(route))
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      try {
        const params = resolveRecoveryQuoterParams({
          route,
          account,
          isDeveloperMode,
          getNetwork
        })
        if (!params) throw new Error('Could not resolve recovery route')

        // amountIn=0 yields an import-only recovery quote; take the first one.
        const quote = await new Promise<Quote>((resolve, reject) => {
          const cleanup = subscribeToFirstQuote(params, resolve, () =>
            reject(new Error('No recovery quote available'))
          )
          if (!cleanup) {
            reject(new Error('Could not create recovery quote'))
            return
          }
          activeCleanupRef.current = cleanup
          timeoutId = setTimeout(
            () => reject(new Error('Recovery quote timed out')),
            RECOVERY_QUOTE_TIMEOUT_MS
          )
        })
        // The first quote settled the subscription itself; stand the guards
        // down so the finally doesn't double-unsubscribe.
        activeCleanupRef.current = null

        const transfer = await FusionService.transferAsset(quote, {
          estimateGasMarginBps: transferGasMarginBps
        })

        if (transfer.status === 'failed') {
          const reason =
            transfer.errorReason ?? transfer.errorCode ?? 'Unknown reason'
          throw new Error(`Recovery transfer failed: ${reason}`)
        }

        invalidateStuckAtomicFunds()
      } catch (error) {
        if (!isUserRejectionError(error)) {
          Logger.error('[useStuckFundsRecovery] recovery failed', error)
          if (isMountedRef.current) {
            showSnackbar('Recovery failed. Please try again.')
          }
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        // Tear down a still-live subscription (timeout / early throw path).
        activeCleanupRef.current?.()
        activeCleanupRef.current = null
        isRecoveringRef.current = false
        if (isMountedRef.current) setRecoveringKey(null)
      }
    },
    [account, isDeveloperMode, transferGasMarginBps, getNetwork]
  )

  return { recover, recoveringKey }
}
