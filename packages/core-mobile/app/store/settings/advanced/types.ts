import { WalletType } from 'services/wallet/types'

// Allowlist (not denylist): future wallet types fail-safe — they must
// be explicitly added here to become eligible. Hardware wallets can't
// auto-approve because the Ledger sign flow has no auto-approve path.
export const QUICK_SWAPS_SOFTWARE_WALLET_TYPES: ReadonlySet<WalletType> =
  new Set([WalletType.MNEMONIC, WalletType.SEEDLESS, WalletType.PRIVATE_KEY])

export const QUICK_SWAP_FEE_LEVELS = ['low', 'medium', 'high'] as const
export type QuickSwapFeeLevel = typeof QUICK_SWAP_FEE_LEVELS[number]

export const QUICK_SWAP_MAX_BUY_VALUES = [
  'unlimited',
  '1000',
  '5000',
  '10000',
  '50000'
] as const
export type QuickSwapMaxBuy = typeof QUICK_SWAP_MAX_BUY_VALUES[number]

export type QuickSwapsSettings = {
  isEnabled: boolean
  feeSetting: QuickSwapFeeLevel
  maxBuy: QuickSwapMaxBuy
}

// Matches core-extension's default (SettingsService.ts: maxBuy: 'unlimited').
// Users opt into a cap explicitly via the Settings dropdown.
export const QUICK_SWAPS_DEFAULT: QuickSwapsSettings = {
  isEnabled: false,
  feeSetting: 'medium',
  maxBuy: 'unlimited'
}

export type AdvancedState = {
  developerMode: boolean
  isLeftHanded: boolean
  quickSwaps: QuickSwapsSettings
}

export const initialState: AdvancedState = {
  developerMode: false,
  isLeftHanded: false,
  quickSwaps: QUICK_SWAPS_DEFAULT
}
