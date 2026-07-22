import { AppListenerEffectAPI } from 'store/types'
import { selectIsEarnBlocked } from 'store/posthog'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { stakeCompleteNotificationRecordsStore } from 'features/notifications/store/stakeCompleteNotificationRecords'
import { fromUnixTime } from 'date-fns'
import { StakeCompleteNotification } from '../types'
import { isStakeCompleteNotificationDisabled } from './utils'

export const handleScheduleStakingCompleteNotifications = async (
  listenerApi: AppListenerEffectAPI,
  stakeCompleteNotification: StakeCompleteNotification[]
): Promise<void> => {
  const state = listenerApi.getState()
  const isEarnBlocked = selectIsEarnBlocked(state)
  if (isEarnBlocked) {
    Logger.info(
      'Earn featured is not enabled, no notification will be scheduled'
    )
    return
  }

  const stakeCompleteNotificationDisabled =
    await isStakeCompleteNotificationDisabled(listenerApi)

  if (stakeCompleteNotificationDisabled) {
    Logger.info(
      'user has disabled either stake complete in-app notification or system-level notification, no notification will be scheduled'
    )
    return
  }

  // Record what gets scheduled so the notification center can list the
  // pushes after they fire (Notifee only keeps PENDING triggers). Upserting
  // the full batch — not just newly created triggers — also backfills
  // records for triggers scheduled before this store existed.
  // `endTimestamp` arrives in unix SECONDS (Glacier's PChainTransaction /
  // `getUnixTime` at the dispatch sites); records store milliseconds. An
  // `accountId` is required: the center labels rows by account and drops
  // records whose account is unknown, so a record without one could never
  // render.
  stakeCompleteNotificationRecordsStore.getState().upsert(
    stakeCompleteNotification.flatMap(data =>
      data.txHash && data.endTimestamp && data.accountId
        ? [
            {
              txHash: data.txHash,
              endTimestamp: fromUnixTime(data.endTimestamp).getTime(),
              accountId: data.accountId,
              isDeveloperMode: data.isDeveloperMode ?? false
            }
          ]
        : []
    )
  )

  await NotificationsService.updateStakeCompleteNotification(
    stakeCompleteNotification
  )
}
