import { ZustandStorageKeys } from 'resources/Constants'
import { LedgerDerivationPathType, LedgerDevice } from 'services/ledger/types'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Network } from '@avalabs/core-chains-sdk'
import { OnDelegationProgress } from 'contexts/DelegationContext'
import { RpcMethod } from '@avalabs/vm-module-types'

type WalletId = string

// Types for ledger review transaction params
export type StakingProgressParams = {
  totalSteps: number
  onComplete: () => void
  onCancel: () => void
}

export type LedgerReviewTransactionParams = {
  rpcMethod?: RpcMethod
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
