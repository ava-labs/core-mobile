import { ZustandStorageKeys } from 'resources/Constants'
import { LedgerDerivationPathType, LedgerDevice } from 'services/ledger/types'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type walletId = string

interface LedgerWalletMapState {
  ledgerWalletMap: Record<
    walletId,
    {
      device: Omit<LedgerDevice, 'rssi'>
      derivationPathType: LedgerDerivationPathType
    }
  >
  setLedgerWalletMap: (
    walletId: walletId,
    device: Omit<LedgerDevice, 'rssi'>,
    derivationPathType: LedgerDerivationPathType
  ) => void
  removeLedgerWallet: (walletId: walletId) => void
  resetLedgerWalletMap: () => void
  getLedgerInfoByWalletId: (walletId?: walletId | null) => {
    device: Omit<LedgerDevice, 'rssi'> | undefined
    derivationPathType: LedgerDerivationPathType | undefined
  }
}

export const ledgerWalletMapStore = create<LedgerWalletMapState>()(
  persist(
    (set, get) => ({
      ledgerWalletMap: {},
      getLedgerInfoByWalletId: (walletId?: walletId | null) => {
        const ledgerWallet = walletId
          ? get().ledgerWalletMap[walletId]
          : undefined
        return {
          device: ledgerWallet?.device,
          derivationPathType: ledgerWallet?.derivationPathType
        }
      },
      setLedgerWalletMap: (
        walletId: walletId,
        device: Omit<LedgerDevice, 'rssi'>,
        derivationPathType: LedgerDerivationPathType
      ) =>
        set({
          ledgerWalletMap: {
            ...get().ledgerWalletMap,
            [walletId]: { device, derivationPathType }
          }
        }),
      removeLedgerWallet: (walletId: walletId) => {
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
