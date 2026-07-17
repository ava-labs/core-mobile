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
 * Number of filters the user has toggled on — drives the count badge. The
 * badge counts exactly the rows that read as "on" in the Advanced filters
 * sheet (even at their default values), so what the user enabled is what the
 * badge reports. Returns 0 while the user hasn't enabled anything, so the
 * picker opens looking "unfiltered" even though the web-parity baseline
 * filters underneath.
 */
export const countEnabledFilters = (filters: DelegateFilters): number =>
  [
    filters.uptime.enabled,
    filters.maxFee.enabled,
    filters.minAvailable.enabled,
    filters.minTimeRemaining.enabled
  ].filter(Boolean).length

/**
 * The filters that actually narrow the node list. Per dimension, a
 * user-enabled filter REPLACES the baseline web default (so enabling uptime
 * and dragging it below 75% genuinely loosens the list); a dimension the
 * user hasn't enabled falls back to the baseline seeded on flow entry.
 */
export const resolveEffectiveDelegateFilters = (
  filters: DelegateFilters,
  defaults: DelegateFilters
): DelegateFilters => ({
  uptime: filters.uptime.enabled ? filters.uptime : defaults.uptime,
  maxFee: filters.maxFee.enabled ? filters.maxFee : defaults.maxFee,
  minAvailable: filters.minAvailable.enabled
    ? filters.minAvailable
    : defaults.minAvailable,
  minTimeRemaining: filters.minTimeRemaining.enabled
    ? filters.minTimeRemaining
    : defaults.minTimeRemaining
})

// Seeds the user-facing filters from the baseline: same values (so the sheet's
// controls start at the web defaults) but every toggle off — the baseline
// itself filters from `defaults`, not from here.
const disableAll = (filters: DelegateFilters): DelegateFilters => ({
  uptime: { ...filters.uptime, enabled: false },
  maxFee: { ...filters.maxFee, enabled: false },
  minAvailable: { ...filters.minAvailable, enabled: false },
  minTimeRemaining: { ...filters.minTimeRemaining, enabled: false }
})

type DelegateFiltersStore = {
  /**
   * The user's explicit filters — `enabled` mirrors the Advanced filters
   * sheet's toggles verbatim. NOT what filters the list by itself: the
   * web-parity baseline (`defaults`) applies underneath, and a user-enabled
   * dimension replaces it (see `resolveEffectiveDelegateFilters`).
   */
  filters: DelegateFilters
  // The web-parity baseline seeded on flow entry. Filters every dimension the
  // user hasn't explicitly enabled.
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
  // Seed the baseline, and the user filters as all-off (values kept as seeds
  // for the sheet's controls) — a fresh flow opens with no toggle on.
  seedDefaults: defaults => set({ filters: disableAll(defaults), defaults }),
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
 * Seeds the web-parity baseline (see `createDefaultDelegateFilters`) and
 * resets the user filters to all-off. Call from non-React contexts (e.g. when
 * a new Delegate flow starts) so the node picker opens pre-filtered like web —
 * with no toggle shown as on — and a previous session's filters don't carry
 * over.
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
 * Restake prefill, mirroring web's `restake` location state on the delegate
 * page: when the original validator has left the active set and the user is
 * dropped into the node picker, the amount and duration steps still open
 * prefilled with the original stake's values (web's `DelegationForm` keeps
 * `initialAmount` / `initialDurationMs` regardless of which node ends up
 * selected). Set on EVERY restake entry (fast stake included) so its
 * presence doubles as the "restake leftovers pending" marker that
 * `useStartStaking` checks before a chooser-initiated flow. Unlike the entry
 * flag above this persists for the whole modal session — re-visiting a step
 * re-applies the prefill, like web's page-level state — and is cleared on
 * the next non-restake modal entry (see the add-stake layout), a
 * chooser-initiated flow start, or the next restake (overwrite).
 */
let restakePrefill: { durationDays: number } | null = null

export const setRestakePrefill = (prefill: { durationDays: number }): void => {
  restakePrefill = prefill
}

/** Peeks the active restake prefill (null when no restake entry is pending). */
export const getRestakePrefill = (): { durationDays: number } | null =>
  restakePrefill

export const clearRestakePrefill = (): void => {
  restakePrefill = null
}
