import { useSelector } from 'react-redux'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { selectActiveNetwork } from 'store/network/slice'
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
import { NetworkVMType } from '@avalabs/core-chains-sdk'

// Allowlist (not denylist): future wallet types fail-safe — they must be
// explicitly added here to become eligible.
const SOFTWARE_WALLET_TYPES: ReadonlySet<WalletType> = new Set([
  WalletType.MNEMONIC,
  WalletType.SEEDLESS,
  WalletType.PRIVATE_KEY
])

type UseQuickSwapsResult = {
  // PostHog feature flag is on; controls whether the Settings section
  // is rendered at all.
  flagOn: boolean
  // Eligibility split into wallet + chain so the Settings UI can show
  // a specific reason when the toggle is disabled.
  walletAllowed: boolean
  chainAllowed: boolean
  // flagOn && walletAllowed && chainAllowed — the toggle is interactive.
  isAvailable: boolean
  // isAvailable && saved-settings toggle is on — the bypass actually fires.
  isEnabled: boolean
  feeSetting: QuickSwapFeeLevel
  maxBuy: QuickSwapMaxBuy
}

export const useQuickSwaps = (): UseQuickSwapsResult => {
  // useActiveWallet() throws if no active wallet — Quick Swaps consumers
  // (Settings, SwapScreen, SwapContext) only mount when a wallet is active,
  // so propagating that throw is acceptable and matches sibling hooks.
  const wallet = useActiveWallet()
  const activeNetwork = useSelector(selectActiveNetwork)
  const flagOn = useSelector(selectIsQuickSwapsAvailable)
  const rawIsEnabled = useSelector(selectIsQuickSwapsEnabled)
  const feeSetting = useSelector(selectQuickSwapsFeeSetting)
  const maxBuy = useSelector(selectQuickSwapsMaxBuy)

  const walletAllowed = SOFTWARE_WALLET_TYPES.has(wallet.type)
  const chainAllowed = activeNetwork?.vmName === NetworkVMType.EVM
  const isAvailable = flagOn && walletAllowed && chainAllowed

  return {
    flagOn,
    walletAllowed,
    chainAllowed,
    isAvailable,
    isEnabled: isAvailable && rawIsEnabled,
    feeSetting,
    maxBuy
  }
}
