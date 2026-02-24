import { createZustandStore } from 'common/utils/createZustandStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { ZustandStorageKeys } from 'resources/Constants'
import type { LocalTokenWithBalance } from 'store/balance'
import { mapTransferToSwapStatus } from 'features/notifications/utils'
import type {
  Quote,
  Transfer,
  FusionTransfer,
  FusionTransfersMap
} from '../types'
import { isTransferInProgress } from '../utils/transferStatus'

// Token selection stores
export const useSwapSelectedFromToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useSwapSelectedToToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

// Quote stores for Fusion Service integration
export const useBestQuote = createZustandStore<Quote | null>(null)

// User's quote selection
export type SelectedQuoteIdentifiers = {
  quoteId: string
  serviceType: string
  aggregatorId: string
} | null

export const useUserSelectedQuote =
  createZustandStore<SelectedQuoteIdentifiers>(null)
export const useAllQuotes = createZustandStore<Quote[]>([])

// Fusion service state
export const useIsFusionServiceReady = createZustandStore<boolean>(false)

// Fusion transfer storage with persistence
interface FusionTransfersState {
  transfers: FusionTransfersMap
  setTransfers: (
    next:
      | FusionTransfersMap
      | ((curr: FusionTransfersMap) => FusionTransfersMap)
  ) => void
  removeTransfer: (transferId: string) => void
  clearCompletedTransfers: () => void
  clearAllTransfers: () => void
}

export const fusionTransfersStore = create<FusionTransfersState>()(
  persist(
    set => ({
      transfers: {},
      setTransfers: next =>
        set(state => ({
          transfers: typeof next === 'function' ? next(state.transfers) : next
        })),
      removeTransfer: (transferId: string) =>
        set(state => {
          const { [transferId]: _, ...rest } = state.transfers
          return { transfers: rest }
        }),
      clearCompletedTransfers: () =>
        set(state => ({
          transfers: Object.fromEntries(
            Object.entries(state.transfers).filter(([, t]) => {
              const status = mapTransferToSwapStatus(t.transfer)
              return status === 'in_progress'
            })
          )
        })),
      clearAllTransfers: () => set({ transfers: {} })
    }),
    {
      name: ZustandStorageKeys.FUSION_TRANSFERS,
      storage: zustandMMKVStorage,
      version: 1
    }
  )
)

// Export hook that matches the createZustandStore API
export const useFusionTransfers = (): {
  transfers: FusionTransfersMap
  setTransfers: (
    next:
      | FusionTransfersMap
      | ((curr: FusionTransfersMap) => FusionTransfersMap)
  ) => void
  removeTransfer: (transferId: string) => void
  clearCompletedTransfers: () => void
  clearAllTransfers: () => void
} => {
  const transfers = fusionTransfersStore(s => s.transfers)
  const setTransfers = fusionTransfersStore(s => s.setTransfers)
  const removeTransfer = fusionTransfersStore(s => s.removeTransfer)
  const clearCompletedTransfers = fusionTransfersStore(
    s => s.clearCompletedTransfers
  )
  const clearAllTransfers = fusionTransfersStore(s => s.clearAllTransfers)
  return {
    transfers,
    setTransfers,
    removeTransfer,
    clearCompletedTransfers,
    clearAllTransfers
  }
}

// Expose setState and getState for non-React contexts
useFusionTransfers.setState = (
  next: FusionTransfersMap | ((curr: FusionTransfersMap) => FusionTransfersMap)
) => {
  fusionTransfersStore.getState().setTransfers(next)
}

useFusionTransfers.getState = () => {
  return fusionTransfersStore.getState().transfers
}

useFusionTransfers.removeTransfer = (transferId: string) => {
  fusionTransfersStore.getState().removeTransfer(transferId)
}

useFusionTransfers.clearCompletedTransfers = () => {
  fusionTransfersStore.getState().clearCompletedTransfers()
}

useFusionTransfers.clearAllTransfers = () => {
  fusionTransfersStore.getState().clearAllTransfers()
}

// Updates only the transfer field for a given id; keeps token metadata/timestamp intact
export function updateFusionTransfer(updatedTransfer: Transfer): void {
  fusionTransfersStore.getState().setTransfers(prev => {
    const existing = prev[updatedTransfer.id]
    if (!existing) return prev
    return {
      ...prev,
      [updatedTransfer.id]: { ...existing, transfer: updatedTransfer }
    }
  })
}

// Returns all transfers that need re-tracking after app restart
export function getPendingFusionTransfers(): FusionTransfer[] {
  return Object.values(fusionTransfersStore.getState().transfers).filter(ft =>
    isTransferInProgress(ft.transfer)
  )
}
