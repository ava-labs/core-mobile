import { object, string, nativeEnum } from 'zod'
import { ChannelId } from 'services/notifications/channels'

export const NotificationsBalanceChangeSchema = object({
  data: object({
    accountAddress: string().startsWith('0x'),
    chainId: string(),
    event: string(),
    transactionHash: string().startsWith('0x')
  }),
  notification: object({
    title: string(),
    body: string(),
    sound: string().optional(),
    android: object({
      channelId: nativeEnum(ChannelId).optional()
    }).optional()
  })
})

export enum BalanceChangeEvents {
  BALANCES_SPENT = 'BALANCES_SPENT',
  BALANCES_RECEIVED = 'BALANCES_RECEIVED',
  ALLOWANCE_APPROVED = 'ALLOWANCE_APPROVED'
}
