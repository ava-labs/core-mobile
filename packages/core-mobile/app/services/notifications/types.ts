import {
  ChannelId,
  DEFAULT_ANDROID_CHANNEL
} from 'services/notifications/channels'
import { NotificationData } from 'contexts/DeeplinkContext/types'

export interface DisplayNotificationParams {
  channelId?: ChannelId | typeof DEFAULT_ANDROID_CHANNEL
  title: string
  body?: string
  sound?: string
  data?: NotificationData
}
