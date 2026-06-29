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

/** Number of filters currently turned on — drives the count badge. */
export const countActiveFilters = (filters: DelegateFilters): number =>
  [
    filters.uptime.enabled,
    filters.maxFee.enabled,
    filters.minAvailable.enabled,
    filters.minTimeRemaining.enabled
  ].filter(Boolean).length

type DelegateFiltersStore = {
  filters: DelegateFilters
  setFilters: (filters: DelegateFilters) => void
  reset: () => void
}

/**
 * Filters store. Call with a selector (e.g. `useDelegateFilters(s => s.filters)`)
 * so consumers only re-render on the slice they read.
 */
export const useDelegateFilters = create<DelegateFiltersStore>(set => ({
  filters: DEFAULT_DELEGATE_FILTERS,
  setFilters: filters => set({ filters }),
  reset: () => set({ filters: DEFAULT_DELEGATE_FILTERS })
}))

/**
 * Resets the filters to their defaults. Call from non-React contexts (e.g.
 * when a new Delegate flow starts) so a previous session's filters don't
 * carry over.
 */
export const resetDelegateFilters = (): void =>
  useDelegateFilters.getState().reset()

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
