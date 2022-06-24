import { AppStartListening } from 'store/middleware/listener'
import { onLogOut } from 'store/app'
import { regenerateUserId } from 'store/posthog/slice'
import PostHog from 'posthog-react-native'

export const addPosthogListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onLogOut,
    effect: async (action, api) => {
      api.dispatch(regenerateUserId())
      await PostHog.reset()
    }
  })
}
