import { type Address, type InfoOrderStatusWire } from '@avalabs/perps-sdk'
import { useEffect, useRef, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import {
  getCachedPerpsOpenOrders,
  getPerpsSessionCacheGeneration,
  hasLoadedPerpsOpenOrders,
  setCachedPerpsOpenOrders
} from '../utils/clearPerpsSessionCaches'

export type PerpsOpenOrders = {
  /** Open orders with full trigger / TP-SL metadata (main dex only). */
  readonly orders: readonly InfoOrderStatusWire[]
  /** `true` until the first `frontendOpenOrders` fetch for the user settles. */
  readonly isLoading: boolean
}

/**
 * Module-level stale-while-revalidate cache keyed by user. Survives screen
 * remounts (tab switches, navigation, fast refresh) so a returning screen shows
 * the last known orders immediately instead of blanking to a loading state and
 * blinking derived UI (e.g. position TP/SL) back to a placeholder. A user is
 * only "loading" until its first fetch settles once per app session; after that
 * the cached list is shown and only replaced when a newer fetch returns.
 */
const commitOpenOrdersResult = ({
  user,
  data,
  generation,
  shouldUpdate,
  update
}: {
  user: Address
  data: readonly InfoOrderStatusWire[]
  generation: number
  shouldUpdate: boolean
  update: (orders: readonly InfoOrderStatusWire[]) => void
}): void => {
  if (generation !== getPerpsSessionCacheGeneration()) {
    return
  }
  setCachedPerpsOpenOrders(user, data)
  if (shouldUpdate) {
    update(data)
  }
}

/**
 * Live list of main-dex open orders **with full trigger / TP-SL metadata**.
 *
 * Hyperliquid ships two REST shapes:
 *   - `openOrders`         — minimal rows; trigger metadata stripped.
 *   - `frontendOpenOrders` — rich rows (`isTrigger`, `triggerPx`, `orderType`,
 *                            `isPositionTpsl`, `reduceOnly`, `tif`, `cloid`, …).
 *
 * We use the rich shape so the UI can render TP/SL legs correctly. The matching
 * WS channel (`openOrders`) only pushes the minimal payload, so parsing it would
 * clobber the metadata; instead we subscribe to it purely as a *change
 * notification* and refetch the rich list on every push. `wsResubscribeNonce`
 * forces a fresh subscribe after a reconnect; `clearinghouseRefreshNonce`
 * re-fetches immediately after a local trade / cancel.
 *
 * `frontendOpenOrders` is main-dex only; HIP-3 builder-dex orders are fetched
 * separately by {@link useHip3OpenOrders} and merged by
 * {@link usePerpsAllOpenOrders}.
 */
export const usePerpsOpenOrders = (
  user: Address | undefined
): PerpsOpenOrders => {
  const { manager, wsResubscribeNonce, clearinghouseRefreshNonce } = usePerps()
  // Seed from the module cache so a remount for an already-loaded user shows the
  // last orders immediately (no loading blink); only a never-loaded user starts
  // in the loading state.
  const [orders, setOrders] = useState<readonly InfoOrderStatusWire[]>(() =>
    user !== undefined ? getCachedPerpsOpenOrders(user) ?? [] : []
  )
  const [isLoading, setIsLoading] = useState(
    () => user !== undefined && !hasLoadedPerpsOpenOrders(user)
  )
  const prevUserRef = useRef<Address | undefined>(undefined)

  useEffect(() => {
    if (user === undefined) {
      setOrders([])
      setIsLoading(false)
      prevUserRef.current = undefined
      return
    }
    if (manager === null) {
      return
    }

    // On an account switch, re-seed from that user's cache (empty if never
    // loaded) and only show loading when we have nothing cached yet. Guarded by
    // a ref so reconnect-driven resubscribes for the *same* user don't reset.
    if (prevUserRef.current !== user) {
      setOrders(getCachedPerpsOpenOrders(user) ?? [])
      setIsLoading(!hasLoadedPerpsOpenOrders(user))
      prevUserRef.current = user
    }

    let cancelled = false
    const generation = getPerpsSessionCacheGeneration()
    // Monotonic request id: WS pushes can fire many `fetchRich` calls whose
    // responses may resolve out of order. Only the latest request may commit,
    // otherwise a stale (possibly pre-trigger / empty) snapshot can overwrite a
    // newer one and make TP/SL flicker to "None".
    let latestRequestId = 0

    const fetchRich = (): void => {
      const requestId = ++latestRequestId
      manager.info
        .getFrontendOpenOrders(user)
        .then(data => {
          // Always cache the latest result so remounts start warm, even if this
          // instance unmounted before committing.
          commitOpenOrdersResult({
            user,
            data,
            generation,
            shouldUpdate: !cancelled && requestId === latestRequestId,
            update: setOrders
          })
        })
        .catch(() => {
          // Silent — a transient REST failure keeps the last list; the next WS
          // notification (or refresh nonce) refetches.
        })
        .finally(() => {
          if (!cancelled && requestId === latestRequestId) {
            setIsLoading(false)
          }
        })
    }

    fetchRich()

    const unsub = manager.ws.subscribe(
      { type: 'openOrders', user, dex: '' },
      () => {
        if (!cancelled) {
          fetchRich()
        }
      }
    )

    return () => {
      cancelled = true
      unsub()
    }
  }, [manager, user, wsResubscribeNonce, clearinghouseRefreshNonce])

  return { orders, isLoading }
}
