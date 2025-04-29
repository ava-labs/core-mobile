import { Action, isAnyOf } from '@reduxjs/toolkit'
import { AppStartListening, AppListenerEffectAPI } from 'store/types'
import { onLogIn, onLogOut, onRehydrationComplete } from 'store/app/slice'
import {
  regenerateUserId,
  selectDistinctID,
  selectIsAnalyticsEnabled,
  selectIsLogErrorsWithSentryBlocked,
  selectUserID,
  setFeatureFlags,
  toggleAnalytics
} from 'store/posthog/slice'
import PostHogService from 'services/posthog/PostHogService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'

const FEATURE_FLAGS_FETCH_INTERVAL = 30000 // 30 seconds

const fetchFeatureFlagsPeriodically = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { condition, dispatch } = listenerApi

  const distinctId = selectDistinctID(listenerApi.getState())

  async function fetchFeatureFlags(): Promise<void> {
    const featureFlags = await PostHogService.fetchFeatureFlags(distinctId)
    featureFlags && dispatch(setFeatureFlags(featureFlags))
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await listenerApi.pause(fetchFeatureFlags())

    await Promise.race([
      condition(isAnyOf(onLogIn)),
      listenerApi.delay(FEATURE_FLAGS_FETCH_INTERVAL)
    ])
  }
}

const posthogIdentifyUser = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const distinctId = selectDistinctID(listenerApi.getState())
  await PostHogService.identifyUser(distinctId)
}

const configure = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const userId = selectUserID(state)
  const distinctId = selectDistinctID(state)
  const isAnalyticsEnabled = selectIsAnalyticsEnabled(state)

  PostHogService.configure({ distinctId, userId })

  AnalyticsService.setEnabled(isAnalyticsEnabled)
}

const onSetFeatureFlags = async (
  action: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()

  const isLogErrorsWithSentryBlocked = selectIsLogErrorsWithSentryBlocked(state)
  Logger.setShouldLogErrorToSentry(!isLogErrorsWithSentryBlocked)
}

export const addPosthogListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(
      toggleAnalytics,
      onLogIn,
      regenerateUserId,
      onRehydrationComplete
    ),
    effect: configure
  })

  startListening({
    actionCreator: onLogOut,
    effect: async (action, api) => {
      api.dispatch(regenerateUserId())
    }
  })

  startListening({
    actionCreator: onRehydrationComplete,
    effect: fetchFeatureFlagsPeriodically
  })

  startListening({
    actionCreator: onRehydrationComplete,
    effect: posthogIdentifyUser
  })

  startListening({
    actionCreator: setFeatureFlags,
    effect: onSetFeatureFlags
  })
}
