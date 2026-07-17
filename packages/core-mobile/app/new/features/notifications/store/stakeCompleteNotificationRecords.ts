import { ZustandStorageKeys, zustandPersistStorage } from 'utils/mmkv'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Records whose stake ended longer ago than this are pruned on every write —
// they have aged out of the notification-center window anyway (see
// `STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS`), so keeping them would only
// grow the persisted map forever.
const PRUNE_AFTER_MS = 60 * 24 * 60 * 60 * 1000 // 60 days

export interface StakeCompleteNotificationRecord {
  txHash: string
  /** Stake end time in ms — the moment the local push fires. */
  endTimestamp: number
  /** Owning account — center rows label it and tapping switches to it. */
  accountId: string
  /**
   * Environment the stake lives on. The push scheduler covers BOTH networks,
   * so records from both environments coexist here.
   */
  isDeveloperMode: boolean
}

export interface StakeCompleteNotificationRecordsState {
  /**
   * Local stake-complete push notifications this device has scheduled, keyed
   * by stake txHash. Written by the scheduling listener
   * (`handleScheduleStakingCompleteNotifications`) so the notification
   * center can show exactly the pushes the user actually receives: a record
   * whose `endTimestamp` has passed IS a fired notification. Notifee itself
   * only keeps PENDING triggers, so without these records fired
   * notifications would be unrecoverable.
   */
  records: Record<string, StakeCompleteNotificationRecord>
  upsert: (records: StakeCompleteNotificationRecord[]) => void
  /** Dismissal (swipe / Clear All) — deletes the records for good. */
  remove: (txHashes: string[]) => void
  /**
   * Drops records that have not fired yet. Called when pending triggers get
   * cancelled (notifications disabled / earn blocked) — those pushes will
   * never be delivered, so surfacing them in the center later would be
   * wrong. If scheduling resumes, the scheduler's next pass re-records them.
   */
  removePending: (now: number) => void
}

export const stakeCompleteNotificationRecordsStore =
  create<StakeCompleteNotificationRecordsState>()(
    persist(
      set => ({
        records: {},
        upsert: records =>
          set(state => {
            const pruneBefore = Date.now() - PRUNE_AFTER_MS
            return {
              records: {
                ...Object.fromEntries(
                  Object.entries(state.records).filter(
                    ([, record]) => record.endTimestamp >= pruneBefore
                  )
                ),
                ...Object.fromEntries(
                  records.map(record => [record.txHash, record])
                )
              }
            }
          }),
        remove: txHashes =>
          set(state => {
            const toRemove = new Set(txHashes)
            return {
              records: Object.fromEntries(
                Object.entries(state.records).filter(
                  ([txHash]) => !toRemove.has(txHash)
                )
              )
            }
          }),
        removePending: now =>
          set(state => ({
            records: Object.fromEntries(
              Object.entries(state.records).filter(
                ([, record]) => record.endTimestamp <= now
              )
            )
          }))
      }),
      {
        name: ZustandStorageKeys.STAKE_COMPLETE_NOTIFICATION_RECORDS,
        storage: zustandPersistStorage,
        version: 1
      }
    )
  )
