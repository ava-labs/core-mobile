import { PChainTransaction } from '@avalabs/glacier-sdk'
import { ChannelId } from 'services/notifications/channels'

export type NotificationsState = {
  notificationSubscriptions: Record<ChannelId, boolean>
  hasPromptedAfterFirstDelegation: boolean
}

export type stakeCompleteTriggerData = Pick<
  PChainTransaction,
  'endTimestamp' | 'txHash'
>
