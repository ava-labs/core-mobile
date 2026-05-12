import { RootState } from 'store/types'
import { selectIsQuickSwapsAvailable } from 'store/posthog/slice'
import { selectActiveWallet } from 'store/wallet/slice'
import { QUICK_SWAPS_SOFTWARE_WALLET_TYPES } from './types'

// Composite: the bypass should actually fire. Read this from every
// runtime decision point (signer, validator, hook) so the PostHog
// kill-switch and wallet allowlist can't drift between consumers.
//
// A stale persisted `isEnabled: true` on a hardware wallet or with
// the flag turned off must NOT trigger bypass — that's why we compose
// here instead of letting callers read the raw toggle.
//
// Lives outside slice.ts because the transitive imports (posthog,
// wallet, account, seedless) are heavier than the slice's own tests
// need to load.
export const selectIsQuickSwapsActive = (state: RootState): boolean => {
  if (!selectIsQuickSwapsAvailable(state)) return false
  if (!state.settings.advanced.quickSwaps.isEnabled) return false
  const wallet = selectActiveWallet(state)
  if (!wallet) return false
  return QUICK_SWAPS_SOFTWARE_WALLET_TYPES.has(wallet.type)
}
