import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CompletedTransfer,
  FailedTransfer,
  RefundedTransfer,
  Transfer
} from '@avalabs/fusion-sdk'
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

// Stop tracking a submitted transfer after this long so the Recover button
// can't stay disabled forever if the SDK never reports a terminal status; the
// 60s detection poll reconciles the row either way.
const RECOVERY_TRACK_TIMEOUT_MS = 90_000

// After the import confirms, give the atomic-UTXO indexer a beat to reflect it
// before refetching detection, mirroring web's post-confirmation delay.
const RECOVERY_INDEXER_BUFFER_MS = 1500

type ConcludedTransfer = CompletedTransfer | FailedTransfer | RefundedTransfer

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Resolves once the submitted transfer reaches a terminal status (completed /
 * failed / refunded), or rejects after RECOVERY_TRACK_TIMEOUT_MS. This is the
 * mobile counterpart to web's poll-until-confirmed: `transferAsset` only submits
 * the import, so detection must not be refreshed until the tx actually lands.
 */
const awaitTransferConclusion = (
  transfer: Transfer
): Promise<ConcludedTransfer> =>
  new Promise((resolve, reject) => {
    const timer: { id?: ReturnType<typeof setTimeout> } = {}
    const cancelTracking = FusionService.trackTransfer(
      transfer,
      () => undefined,
      concluded => {
        if (timer.id) clearTimeout(timer.id)
        resolve(concluded)
      }
    )
    // On timeout, stop the SDK-side tracking too (not just this promise) so it
    // doesn't keep polling in the background past the UI's patience.
    timer.id = setTimeout(() => {
      cancelTracking()
      reject(new Error('Recovery tracking timed out'))
    }, RECOVERY_TRACK_TIMEOUT_MS)
  })

/**
 * Waits for a submitted recovery transfer to conclude on-chain, then refreshes
 * detection so the row clears the moment the import actually lands (not at
 * submission). Adds a short post-confirmation buffer like web, surfaces a
 * failure toast on failed/refunded, and always re-checks detection at the end
 * (a timed-out tracking may still confirm; the refetch reconciles).
 */
const settleRecoveryTransfer = async (transfer: Transfer): Promise<void> => {
  try {
    const concluded = await awaitTransferConclusion(transfer)
    if (concluded.status === 'completed') {
      await sleep(RECOVERY_INDEXER_BUFFER_MS)
    } else {
      showSnackbar('Recovery failed. Please try again.')
    }
  } catch (error) {
    Logger.error('[useStuckFundsRecovery] transfer tracking failed', error)
  } finally {
    invalidateStuckAtomicFunds()
  }
}

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
 * Resolves the first import-only recovery quote for `params`, rejecting on
 * stream failure or after RECOVERY_QUOTE_TIMEOUT_MS. Passes the subscription's
 * cleanup to `registerCleanup` so the caller can tear it down on unmount. The
 * timeout is cleared the moment the quote settles, so a slow approval doesn't
 * leave the timer armed to fire needlessly.
 */
const awaitFirstRecoveryQuote = (
  params: QuoterParams,
  registerCleanup: (cleanup: () => void) => void
): Promise<Quote> =>
  new Promise<Quote>((resolve, reject) => {
    const timer: { id?: ReturnType<typeof setTimeout> } = {}
    const clearTimer = (): void => {
      if (timer.id) clearTimeout(timer.id)
    }
    const cleanup = subscribeToFirstQuote(
      params,
      quote => {
        clearTimer()
        resolve(quote)
      },
      () => {
        clearTimer()
        reject(new Error('No recovery quote available'))
      }
    )
    if (!cleanup) {
      reject(new Error('Could not create recovery quote'))
      return
    }
    registerCleanup(cleanup)
    timer.id = setTimeout(
      () => reject(new Error('Recovery quote timed out')),
      RECOVERY_QUOTE_TIMEOUT_MS
    )
  })

/**
 * Recovers a stranded CCT route directly from the banner (no swap screen).
 * Mirrors web's Recover UX: builds an import-only recovery quote via the Fusion
 * SDK (`amountIn=0`, the flow the SDK author prescribed) and calls
 * `transferAsset`, which surfaces the standard CCT approval and submits the
 * import. It then tracks the transfer to on-chain conclusion (web polls the tx)
 * before refreshing detection, so the row clears when the funds actually move.
 *
 * `recoveringKey` is the key (`source-dest`) of the route currently recovering
 * — held until the transfer concludes — or null; callers use it to show per-row
 * progress and disable re-entry.
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
      try {
        const params = resolveRecoveryQuoterParams({
          route,
          account,
          isDeveloperMode,
          getNetwork
        })
        if (!params) throw new Error('Could not resolve recovery route')

        // amountIn=0 yields an import-only recovery quote; take the first one.
        const quote = await awaitFirstRecoveryQuote(params, cleanup => {
          activeCleanupRef.current = cleanup
        })
        // The first quote settled the subscription itself; stand the guard down
        // so the finally doesn't double-unsubscribe.
        activeCleanupRef.current = null

        // transferAsset only *submits* the import (surfacing the CCT approval);
        // it resolves before the tx confirms. Keep the row in its "Recovering"
        // state and wait for the transfer to conclude on-chain before refreshing
        // detection, so the row clears when the funds actually move — not at
        // submission (which was too early to ever see the cleared state).
        const transfer = await FusionService.transferAsset(quote, {
          estimateGasMarginBps: transferGasMarginBps
        })
        await settleRecoveryTransfer(transfer)
      } catch (error) {
        if (!isUserRejectionError(error)) {
          Logger.error('[useStuckFundsRecovery] recovery failed', error)
          if (isMountedRef.current) {
            showSnackbar('Recovery failed. Please try again.')
          }
        }
      } finally {
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
