import { PChainTransaction } from '@avalabs/glacier-sdk'
import { ChannelId } from 'services/notifications/channels'

export type NotificationsState = {
  notificationSubscriptions: Record<ChannelId, boolean>
}

export type StakeCompleteNotification = Pick<
  PChainTransaction,
  'endTimestamp' | 'txHash'
> & {
  accountId?: string
  isDeveloperMode?: boolean
}
