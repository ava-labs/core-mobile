import { Network } from '@avalabs/core-chains-sdk'
import { ZustandStorageKeys } from 'resources/Constants'
import { OnDelegationProgress } from 'contexts/DelegationContext'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type walletId = string

interface LedgerWalletMapState {
  ledgerWalletMap: Record<walletId, { deviceId: string; deviceName: string }>
  setLedgerWalletMap: (
    walletId: walletId,
    deviceId: string,
    deviceName: string
  ) => void
  removeLedgerWallet: (walletId: walletId) => void
  resetLedgerWalletMap: () => void
}

// Types for ledger review transaction params
export type StakingProgressParams = {
  totalSteps: number
  onComplete: () => void
  onCancel: () => void
}

export type LedgerReviewTransactionParams = {
  network: Network
  onApprove: (onProgress?: OnDelegationProgress) => Promise<void>
  onReject: (message?: string) => void
  stakingProgress?: StakingProgressParams
}

interface LedgerParamsState {
  reviewTransactionParams: LedgerReviewTransactionParams | null
  setReviewTransactionParams: (
    params: LedgerReviewTransactionParams | null
  ) => void
}

export const ledgerWalletMapStore = create<LedgerWalletMapState>()(
  persist(
    (set, get) => ({
      ledgerWalletMap: {},
      setLedgerWalletMap: (
        walletId: walletId,
        deviceId: string,
        deviceName: string
      ) =>
        set({
          ledgerWalletMap: {
            ...get().ledgerWalletMap,
            [walletId]: { deviceId, deviceName }
          }
        }),
      removeLedgerWallet: (walletId: walletId) => {
        const newLedgerWalletMap = get().ledgerWalletMap
        delete newLedgerWalletMap[walletId]
        set({
          ledgerWalletMap: newLedgerWalletMap
        })
      },
      resetLedgerWalletMap: () => set({ ledgerWalletMap: {} })
    }),
    {
      name: ZustandStorageKeys.LEDGER_WALLET_MAP,
      storage: zustandMMKVStorage
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
