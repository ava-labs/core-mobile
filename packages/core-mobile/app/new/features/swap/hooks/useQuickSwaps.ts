import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import type Big from 'big.js'
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
import { isAmountOverLimit } from '../utils/quickSwapsLimits'

const HARDWARE_WALLET_TYPES: ReadonlySet<WalletType> = new Set([
  WalletType.LEDGER,
  WalletType.LEDGER_LIVE,
  WalletType.KEYSTONE
])

type UseQuickSwapsResult = {
  isAvailable: boolean
  isEnabled: boolean
  feeSetting: QuickSwapFeeLevel
  maxBuy: QuickSwapMaxBuy
  isAmountOverLimit: (amountUsd: Big | undefined) => boolean
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

  const walletAllowed = !HARDWARE_WALLET_TYPES.has(wallet.type)
  const chainAllowed = activeNetwork?.vmName === NetworkVMType.EVM
  const isAvailable = flagOn && walletAllowed && chainAllowed

  const overLimit = useCallback(
    (amountUsd: Big | undefined) => isAmountOverLimit(amountUsd, maxBuy),
    [maxBuy]
  )

  return {
    isAvailable,
    isEnabled: isAvailable && rawIsEnabled,
    feeSetting,
    maxBuy,
    isAmountOverLimit: overLimit
  }
}
