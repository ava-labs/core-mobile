import { createZustandStore } from 'common/utils/createZustandStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { ZustandStorageKeys, zustandStorageMMKV } from 'utils/mmkv'
import type { LocalTokenWithBalance } from 'store/balance'
import { mapTransferToSwapStatus } from 'features/notifications/utils'
import { parseTransfer, stringifyTransfer } from '@avalabs/fusion-sdk'
import Logger from 'utils/Logger'
import type {
  Quote,
  Transfer,
  FusionTransfer,
  FusionTransfersMap
} from '../types'
import { isConcludedTransfer } from '../utils/transferStatus'

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

export const useUserSelectedQuoteIds =
  createZustandStore<SelectedQuoteIdentifiers>(null)
// Ids for the quote promoted by pre-swap auto-advance when the best quote
// fails fee validation with a provider-specific error. Kept distinct from
// useUserSelectedQuoteIds so it doesn't flip the flow into manual-selection
// mode (which would disable swap-time retry and mis-tag analytics as
// 'manual').
export const useAutoAdvancedQuoteIds =
  createZustandStore<SelectedQuoteIdentifiers>(null)
export const useAllQuotes = createZustandStore<Quote[]>([])

// Fusion service state
export const useIsFusionServiceReady = createZustandStore<boolean>(false)

// Non-null when the Fusion SDK failed to initialize (e.g. no services could start).
// Used to render a full-screen error state on the swap screen, matching the
// extension's behaviour when `transferManagerError` is set.
export const useFusionServiceInitError = createZustandStore<Error | null>(null)

// Persist storage for FusionTransfers.
// stringifyTransfer/parseTransfer handle bigint serialization via {__type:'bigint'} tagging.
type SerializedFusionTransfer = Omit<FusionTransfer, 'transfer'> & {
  transfer: string
}

const fusionTransfersPersistStorage: PersistStorage<FusionTransfersState> = {
  getItem: (name: string) => {
    const raw = zustandStorageMMKV.getString(name)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as StorageValue<{
        transfers: Record<string, SerializedFusionTransfer>
      }>
      const transfers: FusionTransfersMap = {}
      for (const [id, ft] of Object.entries(parsed.state?.transfers ?? {})) {
        try {
          transfers[id] = { ...ft, transfer: parseTransfer(ft.transfer) }
        } catch (e) {
          Logger.warn(
            `[FusionTransfers] Skipping unparseable transfer ${id}`,
            e
          )
        }
      }
      return {
        ...parsed,
        state: { transfers }
      } as StorageValue<FusionTransfersState>
    } catch {
      return null
    }
  },
  setItem: (name: string, value: StorageValue<FusionTransfersState>) => {
    const serialized: Record<string, SerializedFusionTransfer> = {}
    for (const [id, ft] of Object.entries(value.state.transfers)) {
      serialized[id] = { ...ft, transfer: stringifyTransfer(ft.transfer) }
    }
    zustandStorageMMKV.set(
      name,
      JSON.stringify({ ...value, state: { transfers: serialized } })
    )
  },
  removeItem: (name: string) => {
    zustandStorageMMKV.remove(name)
  }
}

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
      storage: fusionTransfersPersistStorage,
      version: 1
    }
  )
)

export const useFusionTransfers = (): FusionTransfersState => {
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
  return Object.values(fusionTransfersStore.getState().transfers).filter(
    ft => !isConcludedTransfer(ft.transfer)
  )
}
