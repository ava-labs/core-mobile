import {
  type Address,
  type AssetPosition,
  type ClearinghouseState
} from '@avalabs/perps-sdk'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import {
  aggregateHip3Positions,
  hip3DexNames,
  seedHip3Clearinghouses,
  startHip3ClearinghouseFeed
} from '../utils/hip3Feed'
import {
  getCachedHip3Positions,
  hasSeededHip3Positions,
  setCachedHip3Positions
} from '../utils/clearPerpsSessionCaches'
import { useHip3Markets } from './useHip3Markets'

export type Hip3PositionsAggregate = {
  /** Non-zero open positions across all HIP-3 dexs (coins namespaced `dex:TICKER`). */
  readonly positions: readonly AssetPosition[]
  /** Summed `marginSummary.accountValue` across the HIP-3 (isolated) clearinghouses. */
  readonly accountValueUsd: number
  /** `true` until the first REST seed across the HIP-3 dexs settles. */
  readonly isLoading: boolean
}

const EMPTY: Hip3PositionsAggregate = {
  positions: [],
  accountValueUsd: 0,
  isLoading: false
}

/**
 * Module-level stale-while-revalidate cache keyed by `user|dexKey`, mirroring
 * {@link useHip3OpenOrders}. Lets a remount (tab switch, navigation, the perps
 * home header re-rendering) seed the last per-dex clearinghouses immediately —
 * so HIP-3 positions don't blank out and re-pop on every reload — and only
 * flips out of the loading state on the first REST seed per scope per session.
 */
const initialStatesFor = (
  scopeKey: string
): Record<string, ClearinghouseState> =>
  scopeKey.length > 0 ? getCachedHip3Positions(scopeKey) ?? {} : {}

const isScopeSeeded = (scopeKey: string): boolean =>
  scopeKey.length > 0 && hasSeededHip3Positions(scopeKey)

/**
 * Aggregates a user's HIP-3 (builder-deployed) perp positions and isolated
 * account value by subscribing to `clearinghouseState(user, dex)` over WS for
 * every builder dex (there is no single cross-dex positions endpoint), seeded
 * once over REST.
 *
 * WS — the same channel the main clearinghouse uses — keeps the list live, so a
 * position closed *outside* a local action (most importantly a **liquidation**,
 * which is price-driven, not a user trade) drops on its own instead of
 * lingering until the next refresh nonce. `clearinghouseRefreshNonce` re-seeds
 * over REST for immediacy after local deposits/trades; `wsResubscribeNonce`
 * forces a fresh WS subscribe after a reconnect. Best-effort: a failing dex is
 * skipped, and WS parse failures are ignored rather than thrown.
 */
export const useHip3Positions = (
  user: Address | undefined
): Hip3PositionsAggregate => {
  const { manager, ready, clearinghouseRefreshNonce, wsResubscribeNonce } =
    usePerps()
  const hip3Markets = useHip3Markets()

  const dexes = useMemo(() => hip3DexNames(hip3Markets), [hip3Markets])
  const dexKey = dexes.join(',')
  const enabled =
    ready && manager !== null && user !== undefined && dexes.length > 0
  const scopeKey =
    user !== undefined && dexes.length > 0 ? `${user}|${dexKey}` : ''

  /** Latest clearinghouse state per builder dex (seeded by REST, kept live by WS). */
  const [statesByDex, setStatesByDex] = useState<
    Record<string, ClearinghouseState>
  >(() => initialStatesFor(scopeKey))
  const [seeded, setSeeded] = useState(() => isScopeSeeded(scopeKey))
  /** `user|dexKey` of the cached states — used to drop them on an account / dex switch. */
  const scopeRef = useRef('')

  // Keep the module cache warm so a remount starts from the last known states
  // instead of an empty/loading state (avoids positions blinking on reload).
  useEffect(() => {
    if (scopeKey.length === 0) {
      return
    }
    setCachedHip3Positions(scopeKey, statesByDex, seeded)
  }, [scopeKey, statesByDex, seeded])

  // Live per-dex WS subscriptions. `wsResubscribeNonce` forces a resubscribe
  // after a reconnect; `clearinghouseRefreshNonce` is intentionally NOT a dep
  // here (re-seeding is handled below without tearing down the sockets).
  useEffect(() => {
    if (!enabled || manager === null || user === undefined) {
      return
    }
    return startHip3ClearinghouseFeed({
      manager,
      user,
      dexes,
      scopeKey: `${user}|${dexKey}`,
      scopeRef,
      setState: setStatesByDex,
      setSeeded
    })
  }, [enabled, manager, user, dexKey, dexes, wsResubscribeNonce])

  // REST seed (and re-seed after local deposits/trades via the refresh nonce),
  // merged into the same per-dex map without clearing it (no flicker).
  useEffect(() => {
    if (!enabled || manager === null || user === undefined) {
      return
    }
    return seedHip3Clearinghouses({
      manager,
      user,
      dexes,
      setState: setStatesByDex,
      setSeeded
    })
  }, [enabled, manager, user, dexKey, dexes, clearinghouseRefreshNonce])

  const aggregate = useMemo(
    () => aggregateHip3Positions(statesByDex, dexes),
    [statesByDex, dexes]
  )

  if (!enabled) {
    return EMPTY
  }
  return {
    positions: aggregate.positions,
    accountValueUsd: aggregate.accountValueUsd,
    isLoading: !seeded
  }
}
