import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccounts } from 'store/account'
import { selectIsEarnBlocked } from 'store/posthog'
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
 * has passed is a push that has fired. Records whose account no longer
 * exists are dropped: accounts vanish with their wallet, so this guard also
 * hides a removed wallet's records — tapping one would otherwise activate a
 * dead account id.
 */
export const deriveStakeCompleteNotifications = ({
  records,
  accounts,
  now
}: {
  records: Record<string, StakeCompleteNotificationRecord>
  /** Existing accounts keyed by account id (`selectAccounts`). */
  accounts: Record<string, unknown>
  now: number
}): StakeCompleteNotificationItem[] => {
  const windowStartMs =
    now - STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS * MS_PER_DAY

  return Object.values(records)
    .filter(
      record =>
        record.endTimestamp <= now &&
        record.endTimestamp >= windowStartMs &&
        record.accountId in accounts
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
  const accounts = useSelector(selectAccounts)
  // With earn feature-flagged off, every earn surface is blocked — hide the
  // items rather than render rows whose tap would open a blocked screen
  // (the push deeplink path guards the same way in `handleDeeplink`). The
  // records stay in the store, so the items return if the flag comes back.
  const isEarnBlocked = useSelector(selectIsEarnBlocked)

  const items = useMemo(
    () =>
      isEarnBlocked
        ? []
        : deriveStakeCompleteNotifications({
            records,
            accounts,
            now: Date.now()
          }),
    [isEarnBlocked, records, accounts]
  )

  return { items }
}
