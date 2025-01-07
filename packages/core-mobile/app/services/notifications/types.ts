import { ChannelId } from 'services/notifications/channels'
import { NotificationData } from 'contexts/DeeplinkContext/types'

export interface DisplayNotificationParams {
  channelId?: ChannelId
  title: string
  body?: string
  sound?: string
  data?: NotificationData
}
