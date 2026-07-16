import { ZustandStorageKeys, zustandPersistStorage } from 'utils/mmkv'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Dismissed entries older than this are pruned on every write — they have
// aged out of the notification-center window anyway (see
// `STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS`), so keeping them would only
// grow the persisted map forever.
const PRUNE_AFTER_MS = 60 * 24 * 60 * 60 * 1000 // 60 days

export interface DismissedStakeNotificationsState {
  /**
   * Stake-complete notifications the user swiped away / cleared from the
   * notification center, keyed by stake txHash. The value is the stake's end
   * timestamp (ms), kept so stale entries can be pruned.
   *
   * Needed because the center items are DERIVED from completed stakes on
   * every render — without this record a dismissed item would simply
   * reappear.
   */
  dismissedTxHashes: Record<string, number>
  dismiss: (items: { txHash: string; timestamp: number }[]) => void
}

export const dismissedStakeNotificationsStore =
  create<DismissedStakeNotificationsState>()(
    persist(
      set => ({
        dismissedTxHashes: {},
        dismiss: items =>
          set(state => {
            const pruneBefore = Date.now() - PRUNE_AFTER_MS
            return {
              dismissedTxHashes: {
                ...Object.fromEntries(
                  Object.entries(state.dismissedTxHashes).filter(
                    ([, endTimestamp]) => endTimestamp >= pruneBefore
                  )
                ),
                ...Object.fromEntries(
                  items.map(item => [item.txHash, item.timestamp])
                )
              }
            }
          })
      }),
      {
        name: ZustandStorageKeys.DISMISSED_STAKE_NOTIFICATIONS,
        storage: zustandPersistStorage,
        version: 1
      }
    )
  )

export const useDismissedStakeNotifications =
  (): DismissedStakeNotificationsState => dismissedStakeNotificationsStore()
