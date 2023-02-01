import { AppStartListening } from 'store/middleware/listener'
import { onLogOut } from 'store/app'
import { capture, regenerateUserId, selectUserID } from 'store/posthog/slice'
import PostHog, { JsonMap } from 'posthog-react-native'
import Logger from 'utils/Logger'

export const posthogCapture = ({
  posthogUserId,
  event,
  properties
}: {
  posthogUserId: string
  event: string
  properties?: JsonMap
}) => {
  Logger.info(`posthog capture: ${event}`, properties)

  return PostHog.capture(event, {
    ...properties,
    $ip: '',
    $user_id: posthogUserId
  })
}

export const addPosthogListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onLogOut,
    effect: async (action, api) => {
      api.dispatch(regenerateUserId())
      await PostHog.reset()
    }
  })

  startListening({
    actionCreator: capture,
    effect: async (action, api) => {
      const posthogUserId = selectUserID(api.getState())
      const { event, properties } = action.payload
      posthogCapture({ posthogUserId, event, properties })
    }
  })
}
