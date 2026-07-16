import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { getUnixTime, subDays } from 'date-fns'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectAccounts } from 'store/account'
import { selectIsEarnBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveWallet } from 'store/wallet/slice'
import { useDismissedStakeNotifications } from '../store/dismissedStakeNotifications'

/**
 * The notification center is an inbox of RECENT items (the backend feed is
 * unread-only), not a history archive — stake history lives on the stake
 * home's Completed filter. Only stakes completed inside this window appear,
 * capped so a heavy parallel staker can't flood the list.
 */
export const STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS = 30
export const STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS = 20

const MS_PER_DAY = 24 * 60 * 60 * 1000
// Stakes can run up to a year, so anything that ENDED inside the window may
// have STARTED up to (max duration + window) ago — mirror the scheduler's
// one-year lookback, extended by the window.
const FETCH_LOOKBACK_DAYS = 365 + STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS

export interface StakeCompleteNotificationItem {
  txHash: string
  /** Owning account — center rows label it and tapping switches to it. */
  accountId: string
  /** Stake end time in ms (list-ordering timestamp). */
  timestamp: number
}

interface TransformedStake {
  txHash: string
  endTimestamp: number | undefined
  accountId: string
  isOnGoing: boolean
}

/**
 * Pure derivation — exported for tests. `endTimestamp` arrives in unix
 * SECONDS (Glacier); item timestamps are ms.
 */
export const deriveStakeCompleteNotifications = ({
  stakes,
  dismissedTxHashes,
  now
}: {
  stakes: TransformedStake[] | undefined
  dismissedTxHashes: Record<string, number>
  now: number
}): StakeCompleteNotificationItem[] => {
  const windowStartMs =
    now - STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS * MS_PER_DAY

  return (stakes ?? [])
    .flatMap<StakeCompleteNotificationItem>(stake => {
      if (stake.endTimestamp === undefined) return []
      const endMs = stake.endTimestamp * 1000
      // Completed only (`endMs <= now` rather than `!isOnGoing`, which is
      // also false for stakes that have not started yet), inside the window,
      // and not dismissed by the user.
      if (endMs > now || endMs < windowStartMs) return []
      if (dismissedTxHashes[stake.txHash] !== undefined) return []
      return [
        {
          txHash: stake.txHash,
          accountId: stake.accountId,
          timestamp: endMs
        }
      ]
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS)
}

/**
 * Locally-derived stake-complete entries for the notification center
 * (CP-14749). Mirrors the local push-notification scheduler's scope — ALL
 * accounts of the active wallet (`getTransformedStakesForAllAccounts`) — so
 * every completed stake the user got a push for also shows up here.
 *
 * Derived from on-chain stakes rather than from fired notifications: the
 * chain is the source of truth, so the inbox survives reinstalls (within the
 * window). Dismissals are tracked locally (see
 * `dismissedStakeNotificationsStore`).
 */
export const useStakeCompleteNotifications = (): {
  items: StakeCompleteNotificationItem[]
  isLoading: boolean
} => {
  const activeWallet = useSelector(selectActiveWallet)
  const accounts = useSelector(selectAccounts)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isEarnBlocked = useSelector(selectIsEarnBlocked)
  const { dismissedTxHashes } = useDismissedStakeNotifications()

  const accountList = useMemo(() => Object.values(accounts), [accounts])

  const { data: stakes, isLoading } = useQuery({
    // Object segments are hashed structurally by react-query, and both come
    // from stable redux references — the key only changes when the wallet or
    // account set actually changes.
    queryKey: [
      ReactQueryKeys.STAKE_COMPLETE_NOTIFICATIONS,
      activeWallet,
      isDeveloperMode,
      accountList
    ],
    enabled: !isEarnBlocked && !!activeWallet && accountList.length > 0,
    // Same cadence as the backend notification feed.
    staleTime: 1000 * 60,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const wallet = activeWallet!
      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: wallet.id,
        walletType: wallet.type,
        accounts: accountList,
        isTestnet: isDeveloperMode,
        startTimestamp: getUnixTime(subDays(new Date(), FETCH_LOOKBACK_DAYS))
      })
      return result ?? []
    }
  })

  const items = useMemo(
    () =>
      deriveStakeCompleteNotifications({
        stakes,
        dismissedTxHashes,
        now: Date.now()
      }),
    [stakes, dismissedTxHashes]
  )

  return { items, isLoading }
}
