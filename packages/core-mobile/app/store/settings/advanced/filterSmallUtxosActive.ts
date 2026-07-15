import type { RootState } from 'store/types'
import { selectIsFilterSmallUtxosAvailable } from 'store/posthog/slice'

// Composite gate: PostHog kill-switch AND the user's saved toggle. Read this
// from every runtime decision point (balance requests, P-Chain send tx
// building, CCT getUtxos) so the kill-switch can't drift between consumers.
// A stale persisted `filterSmallUtxos: true` with the flag off must NOT
// filter anything.
//
// Lives outside slice.ts because posthog's transitive imports are heavier
// than the slice's own tests need to load (same reason as quickSwapsActive).
export const selectIsFilterSmallUtxosActive = (state: RootState): boolean => {
  if (!selectIsFilterSmallUtxosAvailable(state)) return false
  return state.settings.advanced.filterSmallUtxos
}
