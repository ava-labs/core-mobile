import { useSelector } from 'react-redux'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { selectIsQuickSwapsAvailable } from 'store/posthog'
import {
  selectIsQuickSwapsEnabled,
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy
} from 'store/settings/advanced/slice'
import type {
  QuickSwapFeeLevel,
  QuickSwapMaxBuy
} from 'store/settings/advanced/types'
import { WalletType } from 'services/wallet/types'

// Allowlist: future wallet types fail-safe — they must be
// explicitly added here to become eligible.
const SOFTWARE_WALLET_TYPES: ReadonlySet<WalletType> = new Set([
  WalletType.MNEMONIC,
  WalletType.SEEDLESS,
  WalletType.PRIVATE_KEY
])

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
  isEnabled: boolean
  feeSetting: QuickSwapFeeLevel
  maxBuy: QuickSwapMaxBuy
}

export const useQuickSwaps = (): UseQuickSwapsResult => {
  const wallet = useActiveWallet()
  const flagOn = useSelector(selectIsQuickSwapsAvailable)
  const rawIsEnabled = useSelector(selectIsQuickSwapsEnabled)
  const feeSetting = useSelector(selectQuickSwapsFeeSetting)
  const maxBuy = useSelector(selectQuickSwapsMaxBuy)

  const walletAllowed = SOFTWARE_WALLET_TYPES.has(wallet.type)
  const isAvailable = flagOn && walletAllowed

  return {
    flagOn,
    walletAllowed,
    isAvailable,
    isEnabled: isAvailable && rawIsEnabled,
    feeSetting,
    maxBuy
  }
}
