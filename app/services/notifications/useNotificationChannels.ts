import { notificationChannels } from 'services/notifications/channels'

export default function useNotificationChannels() {
  // const featureFlags = usePosthogContext()
  //TODO: check feature flags to see which channels to show/hide

  return notificationChannels.filter(_ => true)
}
