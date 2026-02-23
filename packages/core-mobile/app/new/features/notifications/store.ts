import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SwapActivityItem } from './types'
import { mapTransferToSwapStatus } from './utils'

type TransferId = string

const MAX_SWAP_ACTIVITIES = 50
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function pruneSwapActivities(
  activities: Record<TransferId, SwapActivityItem>
): Record<TransferId, SwapActivityItem> {
  const now = Date.now()

  // Drop entries older than the retention window
  let entries = Object.entries(activities).filter(
    ([, s]) => now - s.timestamp < RETENTION_MS
  )

  // If still over the cap, keep the most recent MAX_SWAP_ACTIVITIES by timestamp
  if (entries.length > MAX_SWAP_ACTIVITIES) {
    entries = entries
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, MAX_SWAP_ACTIVITIES)
  }

  return Object.fromEntries(entries)
}

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
        set(state => {
          const newActivities = {
            ...state.swapActivities,
            [item.transfer.id]: item
          }
          // Only prune if we're over the cap
          return {
            swapActivities:
              Object.keys(newActivities).length > MAX_SWAP_ACTIVITIES
                ? pruneSwapActivities(newActivities)
                : newActivities
          }
        }),
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
