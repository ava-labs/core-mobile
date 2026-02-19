import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SwapActivityItem } from './types'

interface SwapActivitiesState {
  swapActivities: SwapActivityItem[]
  saveSwapActivity: (item: SwapActivityItem) => void
  removeSwapActivity: (id: string) => void
  clearCompletedSwapActivities: () => void
}

export const swapActivitiesStore = create<SwapActivitiesState>()(
  persist(
    set => ({
      swapActivities: [],
      saveSwapActivity: (item: SwapActivityItem) =>
        set(state => {
          const exists = state.swapActivities.some(s => s.id === item.id)
          return {
            swapActivities: exists
              ? state.swapActivities.map(s => (s.id === item.id ? item : s))
              : [item, ...state.swapActivities]
          }
        }),
      removeSwapActivity: (id: string) =>
        set(state => ({
          swapActivities: state.swapActivities.filter(s => s.id !== id)
        })),
      clearCompletedSwapActivities: () =>
        set(state => ({
          swapActivities: state.swapActivities.filter(
            s => s.status !== 'completed' && s.status !== 'failed'
          )
        }))
    }),
    {
      name: ZustandStorageKeys.SWAP_ACTIVITIES,
      storage: zustandMMKVStorage
    }
  )
)
