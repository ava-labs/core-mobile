import { isAnyOf } from '@reduxjs/toolkit'
import { AppStartListening } from 'store/middleware/listener'
import { onLogIn, onLogOut, onRehydrationComplete } from 'store/app'
import {
  capture,
  regenerateUserId,
  setFeatureFlags,
  selectUserID,
  selectDistinctID,
  selectIsAnalyticsEnabled
} from 'store/posthog/slice'
import PostHogService from 'services/posthog/PostHogService'
import { AppListenerEffectAPI } from 'store'
import { Action } from '@reduxjs/toolkit'
import { JsonMap } from './types'

const FEATURE_FLAGS_FETCH_INTERVAL = 60000 // 1 minute

export const posthogCapture = ({
  distinctId,
  posthogUserId,
  event,
  properties
}: {
  distinctId: string
  posthogUserId: string
  event: string
  properties?: JsonMap
}) => {
  return PostHogService.capture(event, distinctId, posthogUserId, properties)
}

const fetchFeatureFlagsPeriodically = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
) => {
  const { condition, dispatch } = listenerApi

  const distinctId = selectDistinctID(listenerApi.getState())

  async function fetchFeatureFlags() {
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
) => {
  const distinctId = selectDistinctID(listenerApi.getState())
  await PostHogService.identifyUser(distinctId)
}

export const addPosthogListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onLogOut,
    effect: async (action, api) => {
      api.dispatch(regenerateUserId())
    }
  })

  startListening({
    actionCreator: capture,
    effect: async (action, api) => {
      const state = api.getState()
      const posthogUserId = selectUserID(state)
      const distinctId = selectDistinctID(state)
      const isAnalyticsEnabled = selectIsAnalyticsEnabled(state)
      const { event, properties } = action.payload

      if (isAnalyticsEnabled) {
        posthogCapture({ distinctId, posthogUserId, event, properties })
      }
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
}
