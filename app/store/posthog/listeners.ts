import { AppStartListening } from 'store/middleware/listener'
import { onLogOut, onRehydrationComplete } from 'store/app'
import {
  capture,
  regenerateUserId,
  setFeatureFlags,
  selectUserID,
  selectDistinctID,
  selectIsAnalyticsEnabled
} from 'store/posthog/slice'
import Logger from 'utils/Logger'
import PostHogService from 'services/posthog/PostHogService'
import { AppListenerEffectAPI } from 'store'
import { Action } from '@reduxjs/toolkit'
import { JsonMap } from './types'

const FEATURE_FLAGS_FETCH_INTERVAL = 10000 // 1 minute

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
  Logger.info(`posthog capture: ${event}`, properties)
  return PostHogService.capture(event, distinctId, posthogUserId, properties)
}

const fetchFeatureFlagsPeriodically = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
) => {
  const { dispatch } = listenerApi

  async function fetchFeatureFlags() {
    const featureFlags = await PostHogService.fetchFeatureFlags()
    featureFlags && dispatch(setFeatureFlags(featureFlags))
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await listenerApi.pause(fetchFeatureFlags())

    await listenerApi.delay(FEATURE_FLAGS_FETCH_INTERVAL)
  }
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
}
