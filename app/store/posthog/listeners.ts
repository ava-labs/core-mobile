import { AppStartListening } from 'store/middleware/listener'
import { onLogOut } from 'store/app'
import {
  capture,
  regenerateUserId,
  selectUserID,
  selectDistinctID,
  selectIsAnalyticsEnabled
} from 'store/posthog/slice'
import { JsonMap } from 'posthog-react-native'
import Logger from 'utils/Logger'
import PostHogService from 'services/posthog/PostHogService'

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
}
