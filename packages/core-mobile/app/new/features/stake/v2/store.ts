import { NodeValidator } from 'types/earn'
import { create } from 'zustand'

/**
 * Advanced filters for the V2 Delegate node picker. Each filter has its own
 * `enabled` toggle so a filter only narrows the list when the user turns it
 * on. Numeric units:
 *
 * - `uptime.min`            uptime ≥ N percent (upper bound pinned at 100)
 * - `maxFee.value`          delegation fee ≤ N percent
 * - `minAvailable.value`    available delegation capacity ≥ N AVAX
 * - `minTimeRemaining.value` remaining stake time ≥ N days
 *
 * Bound-dependent defaults (availability/time ranges depend on the staking
 * config and the fetched nodes) are seeded by the filter screen; the store
 * only holds the user's applied selection.
 */
export type DelegateFilters = {
  uptime: { enabled: boolean; min: number }
  maxFee: { enabled: boolean; value: number }
  minAvailable: { enabled: boolean; value: number }
  minTimeRemaining: { enabled: boolean; value: number }
}

export const DEFAULT_DELEGATE_FILTERS: DelegateFilters = {
  uptime: { enabled: false, min: 90 },
  maxFee: { enabled: false, value: 5 },
  minAvailable: { enabled: false, value: 0 },
  minTimeRemaining: { enabled: false, value: 0 }
}

// Web parity: the Delegate picker opens pre-filtered the same way core-web's
// validator search does (`createDefaultValidatorSearchQuery`) — uptime ≥ 75%,
// fee ≤ the network minimum delegation fee, and remaining stake time ≥ the
// network minimum stake duration — so both clients surface the same set of
// nodes by default (mostly "Recommended"), instead of listing every active
// validator. The user can still loosen these in Advanced filters. Minimum
// available capacity is already enforced by the node picker's hard gate, so it
// stays off here to avoid a redundant active-filter badge.
const DEFAULT_UPTIME_MIN_PERCENT = 75

export const createDefaultDelegateFilters = ({
  minFeePercent,
  minStakeDays
}: {
  minFeePercent: number
  minStakeDays: number
}): DelegateFilters => ({
  uptime: { enabled: true, min: DEFAULT_UPTIME_MIN_PERCENT },
  maxFee: { enabled: true, value: minFeePercent },
  minAvailable: { enabled: false, value: 0 },
  minTimeRemaining: { enabled: true, value: minStakeDays }
})

/**
 * Number of filters the user has changed from the seeded defaults — drives the
 * count badge. Returns 0 while the filters still match the defaults seeded on
 * flow entry, so the picker opens looking "unfiltered" even though the
 * web-parity defaults are applied; only a deviation surfaces the badge.
 */
export const countModifiedFilters = (
  filters: DelegateFilters,
  defaults: DelegateFilters
): number => {
  const changed = (
    a: { enabled: boolean; value: number },
    b: { enabled: boolean; value: number }
  ): boolean => a.enabled !== b.enabled || (a.enabled && a.value !== b.value)

  let count = 0
  // `uptime` carries its threshold in `min`; the others use `value`.
  if (
    filters.uptime.enabled !== defaults.uptime.enabled ||
    (filters.uptime.enabled && filters.uptime.min !== defaults.uptime.min)
  ) {
    count++
  }
  if (changed(filters.maxFee, defaults.maxFee)) count++
  if (changed(filters.minAvailable, defaults.minAvailable)) count++
  if (changed(filters.minTimeRemaining, defaults.minTimeRemaining)) count++
  return count
}

type DelegateFiltersStore = {
  filters: DelegateFilters
  // The defaults seeded on flow entry, retained so the count badge can tell
  // whether the user has deviated from them (see `countModifiedFilters`).
  defaults: DelegateFilters
  setFilters: (filters: DelegateFilters) => void
  seedDefaults: (defaults: DelegateFilters) => void
  reset: () => void
}

/**
 * Filters store. Call with a selector (e.g. `useDelegateFilters(s => s.filters)`)
 * so consumers only re-render on the slice they read.
 */
export const useDelegateFilters = create<DelegateFiltersStore>(set => ({
  filters: DEFAULT_DELEGATE_FILTERS,
  defaults: DEFAULT_DELEGATE_FILTERS,
  setFilters: filters => set({ filters }),
  // Seed both the applied filters and the baseline they're compared against, so
  // the freshly-seeded state reads as "unmodified" (no badge).
  seedDefaults: defaults => set({ filters: defaults, defaults }),
  reset: () =>
    set({
      filters: DEFAULT_DELEGATE_FILTERS,
      defaults: DEFAULT_DELEGATE_FILTERS
    })
}))

/**
 * Resets the filters to their defaults. Call from non-React contexts (e.g.
 * when a new Delegate flow starts) so a previous session's filters don't
 * carry over.
 */
export const resetDelegateFilters = (): void =>
  useDelegateFilters.getState().reset()

/**
 * Seeds the filters (and the baseline they're diffed against) with the
 * web-parity defaults (see `createDefaultDelegateFilters`). Call from non-React
 * contexts (e.g. when a new Delegate flow starts) so the node picker opens
 * pre-filtered like web — yet looks "unfiltered" until the user deviates — and
 * a previous session's filters don't carry over.
 */
export const applyDefaultDelegateFilters = (params: {
  minFeePercent: number
  minStakeDays: number
}): void =>
  useDelegateFilters
    .getState()
    .seedDefaults(createDefaultDelegateFilters(params))

/**
 * Holds the validator list (in the order the user is viewing it) and the
 * currently-open index, so the Node details screen can page to the
 * previous/next node via its header chevrons without re-deriving the list.
 */
type DelegateNodeSelectionStore = {
  nodes: NodeValidator[]
  index: number
  setSelection: (nodes: NodeValidator[], index: number) => void
  setIndex: (index: number) => void
}

/**
 * Node-selection store. Call with a selector (e.g.
 * `useDelegateNodeSelection(s => s.index)`) so consumers only re-render on the
 * slice they read.
 */
export const useDelegateNodeSelection = create<DelegateNodeSelectionStore>(
  (set, get) => ({
    nodes: [],
    index: 0,
    setSelection: (nodes, index) => set({ nodes, index }),
    setIndex: index => {
      const { nodes } = get()
      if (nodes.length === 0) return
      set({ index: Math.min(Math.max(index, 0), nodes.length - 1) })
    }
  })
)

/** Sets the node list + selected index from a non-React context. */
export const setDelegateNodeSelection = (
  nodes: NodeValidator[],
  index: number
): void => useDelegateNodeSelection.getState().setSelection(nodes, index)

/**
 * One-shot "entering via restake" flag. `useRestake` seeds the shared stake
 * amount with the original stake's amount *before* navigating, but the
 * add-stake layout re-seeds that store with the minimum stakable amount in a
 * mount effect — and parent effects run after child effects, so the layout
 * would clobber the restake amount. Setting this flag ahead of navigation
 * lets the layout skip that one seed. A module-level slot rather than a
 * zustand store: nothing re-renders on it and it must not outlive a single
 * modal entry.
 */
let pendingRestakeEntry = false

export const beginRestakeEntry = (): void => {
  pendingRestakeEntry = true
}

/** Returns whether a restake entry is pending and clears it (one-shot). */
export const takeRestakeEntry = (): boolean => {
  const pending = pendingRestakeEntry
  pendingRestakeEntry = false
  return pending
}

/**
 * Delegate-restake prefill, mirroring web's `restake` location state on the
 * delegate page: when the original validator has left the active set and the
 * user is dropped into the node picker, the amount and duration steps still
 * open prefilled with the original stake's values (web's `DelegationForm`
 * keeps `initialAmount` / `initialDurationMs` regardless of which node ends
 * up selected). Unlike the entry flag above this persists for the whole
 * modal session — re-visiting a step re-applies the prefill, like web's
 * page-level state — and is cleared on the next non-restake flow entry (see
 * the add-stake layout) or overwritten by the next restake.
 */
let restakePrefill: { durationDays: number } | null = null

export const setRestakePrefill = (prefill: { durationDays: number }): void => {
  restakePrefill = prefill
}

/** Peeks the active restake prefill (null outside a delegate restake). */
export const getRestakePrefill = (): { durationDays: number } | null =>
  restakePrefill

export const clearRestakePrefill = (): void => {
  restakePrefill = null
}
