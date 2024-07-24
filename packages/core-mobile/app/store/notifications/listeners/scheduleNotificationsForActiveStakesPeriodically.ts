import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import { selectIsEarnBlocked } from 'store/posthog'
import Logger from 'utils/Logger'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectAccounts } from 'store/account'
import EarnService from 'services/earn/EarnService'
import NotificationsService from 'services/notifications/NotificationsService'
import { WalletState, selectWalletState } from 'store/app'
import { ChannelId } from 'services/notifications/channels'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { turnOnNotificationsFor } from '../slice'
import { isStakeCompleteNotificationDisabled } from './utils'

const SCHEDULE_INTERVAL = 60000 * 3 // 3 minutes

const isTurnOnNotificationsForStakingCompleteAction = (
  action: Action
): boolean => {
  return (
    turnOnNotificationsFor.match(action) &&
    action.payload.channelId === ChannelId.STAKING_COMPLETE
  )
}

// get the list of active stakes across all accounts
// and schedule notifications accordingly
export const scheduleNotificationsForActiveStakesPeriodically = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<never> => {
  // only allow one instance of this listener to run at a time
  listenerApi.unsubscribe()

  const { getState, condition } = listenerApi

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const walletState = selectWalletState(getState())

    if (walletState === WalletState.ACTIVE) {
      await listenerApi.pause(scheduleNotificationsForActiveStakes(listenerApi))
    }

    // whenever user turns on staking complete notification setting,
    // we try to schedule notifications for active stakes right away
    // otherwise, we wait for the next schedule interval
    await Promise.race([
      condition(isTurnOnNotificationsForStakingCompleteAction),
      listenerApi.delay(SCHEDULE_INTERVAL)
    ])
  }
}

const scheduleNotificationsForActiveStakes = async (
  listenerApi: AppListenerEffectAPI
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

  setTimeout(async () => {
    const isDeveloperMode = selectIsDeveloperMode(state)
    const accounts = selectAccounts(state)

    Logger.info('fetching stakes for all accounts')
    const transformedTransactions =
      await EarnService.getTransformedStakesForAllAccounts({
        isDeveloperMode,
        accounts
      })

    const onGoingTransactions =
      transformedTransactions?.filter(value => value.isOnGoing) ?? []

    const totalStakes = transformedTransactions?.length ?? 0
    const activeStakes = onGoingTransactions.length
    const historyStakes = totalStakes - activeStakes

    AnalyticsService.capture('StakeCountStakes', {
      active: activeStakes,
      history: historyStakes,
      total: totalStakes
    })

    if (onGoingTransactions && onGoingTransactions.length > 0) {
      Logger.info('updating staking complete notifications')
      await NotificationsService.updateStakeCompleteNotification(
        onGoingTransactions
      )
    }
  }, 5000)
}
