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
