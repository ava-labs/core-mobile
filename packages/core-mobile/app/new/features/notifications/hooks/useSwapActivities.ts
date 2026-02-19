import { useState, useEffect } from 'react'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'
import {
  loadArrayFromStorage,
  saveArrayToStorage
} from 'utils/mmkv/storages'
import { SwapActivityItem } from '../types'

/**
 * Reads persisted swap activities from MMKV and subscribes to changes
 * so the returned list stays in sync when saveSwapActivity is called
 * from anywhere in the app (e.g. the swap completion handler).
 */
export function useSwapActivities(): { swapActivities: SwapActivityItem[] } {
  const [swapActivities, setSwapActivities] = useState<SwapActivityItem[]>(() =>
    loadArrayFromStorage<SwapActivityItem>(
      commonStorage,
      StorageKey.SWAP_ACTIVITIES
    )
  )

  useEffect(() => {
    const listener = commonStorage.addOnValueChangedListener(changedKey => {
      if (changedKey === StorageKey.SWAP_ACTIVITIES) {
        setSwapActivities(
          loadArrayFromStorage<SwapActivityItem>(
            commonStorage,
            StorageKey.SWAP_ACTIVITIES
          )
        )
      }
    })
    return () => listener.remove()
  }, [])

  return { swapActivities }
}

/**
 * Removes a single swap activity from MMKV by id.
 * Called when the user swipes left to dismiss a swap item.
 */
export function removeSwapActivity(id: string): void {
  const current = loadArrayFromStorage<SwapActivityItem>(
    commonStorage,
    StorageKey.SWAP_ACTIVITIES
  )
  const updated = current.filter(s => s.id !== id)
  saveArrayToStorage(commonStorage, StorageKey.SWAP_ACTIVITIES, updated)
}

/**
 * Removes all completed swap activities from MMKV, leaving in_progress
 * entries intact. Called by the notification center's "Clear All" action.
 */
export function clearCompletedSwapActivities(): void {
  const current = loadArrayFromStorage<SwapActivityItem>(
    commonStorage,
    StorageKey.SWAP_ACTIVITIES
  )
  const updated = current.filter(s => s.status !== 'completed')
  saveArrayToStorage(commonStorage, StorageKey.SWAP_ACTIVITIES, updated)
}

/**
 * Persists a swap activity to MMKV.
 * - If an entry with the same id already exists it is updated in place
 *   (e.g. status changes from in_progress → completed).
 * - New entries are prepended so the most recent swap appears first.
 *
 * Call this from the swap completion / status-update handler so the
 * notifications screen reflects real swap data automatically.
 */
export function saveSwapActivity(item: SwapActivityItem): void {
  const current = loadArrayFromStorage<SwapActivityItem>(
    commonStorage,
    StorageKey.SWAP_ACTIVITIES
  )
  const exists = current.some(s => s.id === item.id)
  const updated = exists
    ? current.map(s => (s.id === item.id ? item : s))
    : [item, ...current]
  saveArrayToStorage(commonStorage, StorageKey.SWAP_ACTIVITIES, updated)
}
