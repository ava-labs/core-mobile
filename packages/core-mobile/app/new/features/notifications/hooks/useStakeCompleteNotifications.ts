import { useMemo } from 'react'
import {
  StakeCompleteNotificationRecord,
  useStakeCompleteNotificationRecords
} from '../store/stakeCompleteNotificationRecords'

/**
 * The notification center is an inbox of RECENT items (the backend feed is
 * unread-only), not a history archive — stake history lives on the stake
 * home's Completed filter. Only stakes completed inside this window appear,
 * capped so a heavy parallel staker can't flood the list.
 */
export const STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS = 30
export const STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS = 20

const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface StakeCompleteNotificationItem {
  txHash: string
  /** Owning account — center rows label it and tapping switches to it. */
  accountId: string
  /** Stake end time in ms (list-ordering timestamp). */
  timestamp: number
  /**
   * Environment the stake lives on. The push scheduler notifies across BOTH
   * networks, so the center mirrors the pushes: items from both environments
   * are listed and tapping one switches the app to the stake's environment
   * first — same semantics as tapping the push itself
   * (`handleProcessNotificationData`).
   */
  isDeveloperMode: boolean
}

/**
 * Pure derivation — exported for tests. A record whose `endTimestamp` (ms)
 * has passed is a push that has fired.
 */
export const deriveStakeCompleteNotifications = ({
  records,
  now
}: {
  records: Record<string, StakeCompleteNotificationRecord>
  now: number
}): StakeCompleteNotificationItem[] => {
  const windowStartMs =
    now - STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS * MS_PER_DAY

  return Object.values(records)
    .filter(
      record =>
        record.endTimestamp <= now && record.endTimestamp >= windowStartMs
    )
    .sort((a, b) => b.endTimestamp - a.endTimestamp)
    .slice(0, STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS)
    .map(record => ({
      txHash: record.txHash,
      accountId: record.accountId,
      timestamp: record.endTimestamp,
      isDeveloperMode: record.isDeveloperMode
    }))
}

/**
 * Stake-complete entries for the notification center (CP-14749), sourced
 * from the local push notifications this device scheduled (see
 * `stakeCompleteNotificationRecordsStore`): a record whose end time has
 * passed is a push the user actually received. This keeps the center 1:1
 * with the pushes — it respects the notification settings (nothing is
 * recorded while they are off) and never surprises the user with stakes no
 * push was ever sent for. The trade-off is that the list is device-local,
 * like the pushes themselves.
 */
export const useStakeCompleteNotifications = (): {
  items: StakeCompleteNotificationItem[]
} => {
  const { records } = useStakeCompleteNotificationRecords()

  const items = useMemo(
    () =>
      deriveStakeCompleteNotifications({
        records,
        now: Date.now()
      }),
    [records]
  )

  return { items }
}
