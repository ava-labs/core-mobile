import {
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerDevice
} from 'services/ledger/types'
import { ZustandStorageKeys, zustandPersistStorage } from 'utils/mmkv'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OnDelegationProgress } from 'contexts/DelegationContext'

type WalletId = string

export type LedgerReviewTransactionParams = {
  /**
   * Pre-computed Ledger app to prompt for this transaction. The producer
   * (ApprovalController) has the full request context (chain + signing
   * data) and is the right place to derive this — consumers should not
   * have to recompute it from `network` alone, which can yield the wrong
   * app for EVM contract calls on Avalanche C-Chain. See
   * `getLedgerAppForEvmTx` and `getLedgerAppName`.
   */
  appType: LedgerAppType
  onApprove: (onProgress?: OnDelegationProgress) => Promise<void>
  onReject: (message?: string) => void
}

interface LedgerParamsState {
  reviewTransactionParams: LedgerReviewTransactionParams | null
  setReviewTransactionParams: (
    params: LedgerReviewTransactionParams | null
  ) => void
}

interface LedgerWalletMapState {
  ledgerWalletMap: Record<
    WalletId,
    {
      device: Omit<LedgerDevice, 'rssi'>
      derivationPathType: LedgerDerivationPathType
    }
  >
  setLedgerWalletMap: (
    walletId: WalletId,
    device: Omit<LedgerDevice, 'rssi'>,
    derivationPathType: LedgerDerivationPathType
  ) => void
  removeLedgerWallet: (walletId: WalletId) => void
  resetLedgerWalletMap: () => void
  getLedgerInfoByWalletId: (walletId?: WalletId | null) => {
    device: Omit<LedgerDevice, 'rssi'> | undefined
    derivationPathType: LedgerDerivationPathType | undefined
  }
}

export const ledgerWalletMapStore = create<LedgerWalletMapState>()(
  persist(
    (set, get) => ({
      ledgerWalletMap: {},
      getLedgerInfoByWalletId: (walletId?: WalletId | null) => {
        const ledgerWallet = walletId
          ? get().ledgerWalletMap[walletId]
          : undefined
        return {
          device: ledgerWallet?.device,
          derivationPathType: ledgerWallet?.derivationPathType
        }
      },
      setLedgerWalletMap: (
        walletId: WalletId,
        device: Omit<LedgerDevice, 'rssi'>,
        derivationPathType: LedgerDerivationPathType
      ) =>
        set({
          ledgerWalletMap: {
            ...get().ledgerWalletMap,
            [walletId]: { device, derivationPathType }
          }
        }),
      removeLedgerWallet: (walletId: WalletId) => {
        const newLedgerWalletMap = { ...get().ledgerWalletMap }
        delete newLedgerWalletMap[walletId]
        set({
          ledgerWalletMap: newLedgerWalletMap
        })
      },
      resetLedgerWalletMap: () => set({ ledgerWalletMap: {} })
    }),
    {
      name: ZustandStorageKeys.LEDGER_WALLET_MAP,
      storage: zustandPersistStorage
    }
  )
)

export const useLedgerWalletMap = (): LedgerWalletMapState => {
  return ledgerWalletMapStore()
}

// Ephemeral store for ledger params (no persistence needed)
export const ledgerParamsStore = create<LedgerParamsState>(set => ({
  reviewTransactionParams: null,
  setReviewTransactionParams: params => set({ reviewTransactionParams: params })
}))

export const useLedgerParams = (): LedgerParamsState => {
  return ledgerParamsStore()
}
