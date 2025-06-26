import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store/types'
import { selectIsEarnBlocked } from 'store/posthog'
import Logger from 'utils/Logger'
import { selectAccounts } from 'store/account'
import EarnService from 'services/earn/EarnService'
import NotificationsService from 'services/notifications/NotificationsService'
import { WalletState, selectWalletState } from 'store/app'
import { ChannelId } from 'services/notifications/channels'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getUnixTime } from 'date-fns'
import { selectActiveWallet } from 'store/wallet/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'
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
  const activeWallet = selectActiveWallet(state)
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
    const accounts = selectAccounts(state)
    const isDeveloperMode = selectIsDeveloperMode(state)
    if (!activeWallet) {
      Logger.error('Active wallet not found')
      return
    }

    Logger.info('fetching stakes for all accounts')

    // We fetch all stakes here so we can send a notification when active stakes are completed.
    // Since the maximum staking period is one year, any stake created over a year ago can’t be active.
    // So, to reduce overhead, we only fetch transactions with a startTimestamp within the last year.
    const now = new Date()
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(now.getFullYear() - 1)
    const startTimestamp = getUnixTime(oneYearAgo.getTime())

    const transformedTransactions =
      await EarnService.getTransformedStakesForAllAccounts({
        walletId: activeWallet.id,
        walletType: activeWallet.type,
        accounts,
        isTestnet: isDeveloperMode,
        startTimestamp
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
