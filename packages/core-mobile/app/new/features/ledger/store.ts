import { ZustandStorageKeys } from 'resources/Constants'
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
