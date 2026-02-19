import { createZustandStore } from 'common/utils/createZustandStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { ZustandStorageKeys } from 'resources/Constants'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote, FusionTransfersMap } from '../types'

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
}

const fusionTransfersStore = create<FusionTransfersState>()(
  persist(
    set => ({
      transfers: {},
      setTransfers: next =>
        set(state => ({
          transfers: typeof next === 'function' ? next(state.transfers) : next
        }))
    }),
    {
      name: ZustandStorageKeys.FUSION_TRANSFERS,
      storage: zustandMMKVStorage,
      version: 1
    }
  )
)

// Export hook that matches the createZustandStore API
export const useFusionTransfers = (): [
  FusionTransfersMap,
  (
    next:
      | FusionTransfersMap
      | ((curr: FusionTransfersMap) => FusionTransfersMap)
  ) => void
] => {
  const transfers = fusionTransfersStore(s => s.transfers)
  const setTransfers = fusionTransfersStore(s => s.setTransfers)
  return [transfers, setTransfers]
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
