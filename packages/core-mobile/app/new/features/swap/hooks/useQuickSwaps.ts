import { useSelector } from 'react-redux'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { selectIsQuickSwapsAvailable } from 'store/posthog'
import {
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy
} from 'store/settings/advanced/slice'
import { selectIsQuickSwapsActive } from 'store/settings/advanced/quickSwapsActive'
import {
  QUICK_SWAPS_SOFTWARE_WALLET_TYPES,
  type QuickSwapFeeLevel,
  type QuickSwapMaxBuy
} from 'store/settings/advanced/types'

type UseQuickSwapsResult = {
  // PostHog feature flag is on
  flagOn: boolean
  // Hardware wallets can't auto-approve (Ledger sign flow has no
  // auto-approve path). Surfaced so Settings can explain why the toggle
  // is inert. Chain-level gating happens downstream — the per-tx and
  // batch validators reject non-EVM methods, and the EvmSigner only
  // attaches auto-approve for Markr (EVM-only) quotes.
  walletAllowed: boolean
  isAvailable: boolean
  // Composed gate: PostHog flag + wallet allowlist + saved toggle.
  // Same value the signer and validator use (via selectIsQuickSwapsActive),
  // so consumers can't drift.
  isEnabled: boolean
  feeSetting: QuickSwapFeeLevel
  maxBuy: QuickSwapMaxBuy
}

export const useQuickSwaps = (): UseQuickSwapsResult => {
  const wallet = useActiveWallet()
  const flagOn = useSelector(selectIsQuickSwapsAvailable)
  const isEnabled = useSelector(selectIsQuickSwapsActive)
  const feeSetting = useSelector(selectQuickSwapsFeeSetting)
  const maxBuy = useSelector(selectQuickSwapsMaxBuy)

  const walletAllowed = QUICK_SWAPS_SOFTWARE_WALLET_TYPES.has(wallet.type)
  const isAvailable = flagOn && walletAllowed

  return {
    flagOn,
    walletAllowed,
    isAvailable,
    isEnabled,
    feeSetting,
    maxBuy
  }
}
