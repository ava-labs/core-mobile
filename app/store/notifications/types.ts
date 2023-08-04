import { ChannelId } from 'services/notifications/channels'

export type NotificationsState = {
  notificationSubscriptions: Record<ChannelId, boolean>
  hasPromptedAfterFirstDelegation: boolean
}
