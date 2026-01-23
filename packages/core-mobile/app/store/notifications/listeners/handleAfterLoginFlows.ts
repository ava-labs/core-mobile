import { showAlert } from '@avalabs/k2-alpine'
import { AuthorizationStatus } from '@notifee/react-native'
import { AnyAction } from '@reduxjs/toolkit'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { waitForInteractions } from 'common/utils/waitForInteractions'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'
import NotificationsService from 'services/notifications/NotificationsService'
import {
  selectIsEnableNotificationPromptBlocked,
  selectIsNestEggEligible,
  selectIsSolanaLaunchModalBlocked,
  selectIsSolanaSupportBlocked
} from 'store/posthog'
import { AppListenerEffectAPI } from 'store/types'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import {
  selectHasSeenNestEggCampaign,
  selectHasQualifiedForNestEgg,
  selectHasAcknowledgedNestEggQualification
} from 'store/nestEgg'
import Config from 'react-native-config'
import { turnOnAllNotifications } from '../slice'

export const handleAfterLoginFlows = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  await promptAppUpdateScreenIfNeeded()
  await promptEnableNotificationsIfNeeded(listenerApi)
  await promptSolanaLaunchModalIfNeeded(listenerApi)
  await promptNestEggCampaignModalIfNeeded(listenerApi)
}

const promptAppUpdateScreenIfNeeded = async (): Promise<void> => {
  const appUpdateStatus = await AppUpdateService.checkAppUpdateStatus()

  if (!appUpdateStatus) return

  const hasBeenViewedAppUpdateScreen = AppUpdateService.hasSeenAppUpdateScreen(
    appUpdateStatus.version
  )
  const shouldShowAppUpdateScreen =
    hasBeenViewedAppUpdateScreen === false &&
    appUpdateStatus.needsUpdate === true &&
    !Config.E2E_MNEMONIC // TODO: android automation can't handle the app update modal properly on bitrise, so we need to hide it for now
  if (shouldShowAppUpdateScreen) {
    await waitForInteractions()

    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/appUpdate',
      params: {
        appVersion: appUpdateStatus.version
      }
    })
  }
}

const promptEnableNotificationsIfNeeded = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const hasPromptedForNotifications = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_PROMPT
  )(state)
  const isEnableNotificationPromptBlocked =
    selectIsEnableNotificationPromptBlocked(state)

  const authorizationStatus =
    await NotificationsService.getNotificationSettings()

  // show prompt if any of the following is true
  //   - if user has not seen the prompt
  //   - if user has denied/not determined permissions and ff is enabled
  if (
    hasPromptedForNotifications &&
    ((authorizationStatus !== AuthorizationStatus.DENIED &&
      authorizationStatus !== AuthorizationStatus.NOT_DETERMINED) ||
      isEnableNotificationPromptBlocked)
  )
    return

  dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))

  // if user has not seen the prompt and has granted permissions
  // this means user is re-logging into wallet
  // we will silently turn on all notifications
  if (
    authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    dispatch(turnOnAllNotifications())
    return
  }

  await new Promise<void>(resolve => {
    showAlert({
      title: 'Enable push notifications',
      description:
        'Get notified about market updates, special offers, airdrops, balance changes and more',
      buttons: [
        {
          text: 'Not now',
          onPress: () => {
            AnalyticsService.capture('PushNotificationRejected')
            resolve()
          }
        },
        {
          text: 'Turn on',
          onPress: async () => {
            const { permission } = await NotificationsService.getAllPermissions(
              false
            )
            if (permission !== 'authorized') {
              NotificationsService.openSystemSettings()
              return
            }
            dispatch(turnOnAllNotifications())
            AnalyticsService.capture('PushNotificationAccepted')
            resolve()
          }
        }
      ]
    })
  })
}

const promptSolanaLaunchModalIfNeeded = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const hasBeenViewedSolanaLaunch = selectHasBeenViewedOnce(
    ViewOnceKey.SOLANA_LAUNCH
  )(state)

  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)
  const isSolanaLaunchModalBlocked = selectIsSolanaLaunchModalBlocked(state)

  const shouldShowSolanaLaunchModal =
    !hasBeenViewedSolanaLaunch &&
    !isSolanaSupportBlocked &&
    !isSolanaLaunchModalBlocked
  if (shouldShowSolanaLaunchModal) {
    await waitForInteractions()

    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/solanaLaunch'
    })
  }
}

/**
 * Show Nest Egg campaign modal for eligible users who haven't seen it yet
 * Eligibility: seedless wallet + campaign feature flag enabled + hasn't qualified yet
 */
const promptNestEggCampaignModalIfNeeded = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()

  // Check if user is eligible (seedless wallet + feature flag enabled)
  const isNestEggEligible = selectIsNestEggEligible(state)
  // Check if user has already seen the campaign modal
  const hasSeenCampaign = selectHasSeenNestEggCampaign(state)
  // Check if user has already qualified (completed a swap)
  const hasQualified = selectHasQualifiedForNestEgg(state)
  // Check if user has acknowledged qualification
  const hasAcknowledged = selectHasAcknowledgedNestEggQualification(state)

  // First, check if user qualified but hasn't acknowledged yet
  // This handles the case where user qualified, app closed, and now opening again
  if (hasQualified && !hasAcknowledged) {
    await waitForInteractions()

    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/nestEggSuccess'
    })
    return
  }

  // Only show campaign modal if:
  // - User is eligible (seedless + campaign active)
  // - User hasn't seen the campaign modal yet
  // - User hasn't already qualified
  const shouldShowNestEggModal =
    isNestEggEligible && !hasSeenCampaign && !hasQualified

  if (shouldShowNestEggModal) {
    await waitForInteractions()

    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/nestEggCampaign'
    })
  }
}
