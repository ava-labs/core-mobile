import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SwapActivityItem } from './types'
import { mapTransferToSwapStatus } from './utils'

type TransferId = string

interface SwapActivitiesState {
  /** Swap activities keyed by transfer.id for O(1) lookup and deduplication. */
  swapActivities: Record<TransferId, SwapActivityItem>
  saveSwapActivity: (item: SwapActivityItem) => void
  removeSwapActivity: (transferId: TransferId) => void
  clearCompletedSwapActivities: () => void
  clearAllSwapActivities: () => void
}

export const swapActivitiesStore = create<SwapActivitiesState>()(
  persist(
    set => ({
      swapActivities: {},
      saveSwapActivity: (item: SwapActivityItem) =>
        set(state => ({
          swapActivities: {
            ...state.swapActivities,
            [item.transfer.id]: item
          }
        })),
      removeSwapActivity: (transferId: TransferId) =>
        set(state => {
          const { [transferId]: _, ...rest } = state.swapActivities
          return { swapActivities: rest }
        }),
      clearCompletedSwapActivities: () =>
        set(state => ({
          swapActivities: Object.fromEntries(
            Object.entries(state.swapActivities).filter(([, s]) => {
              const status = mapTransferToSwapStatus(s.transfer)
              return status !== 'completed' && status !== 'failed'
            })
          )
        })),
      clearAllSwapActivities: () => set({ swapActivities: {} })
    }),
    {
      name: ZustandStorageKeys.SWAP_ACTIVITIES,
      storage: zustandMMKVStorage
    }
  )
)

// React hook that uses the store
export const useSwapActivitiesStore = (): SwapActivitiesState => {
  return swapActivitiesStore()
}
