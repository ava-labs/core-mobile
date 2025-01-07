import z, { object, string, nativeEnum } from 'zod'
import { ChannelId } from 'services/notifications/channels'
export const NotificationsBalanceChangeDataSchema = object({
  accountAddress: string().startsWith('0x'),
  chainId: string(),
  event: string(),
  transactionHash: string().startsWith('0x'),
  title: string().optional(),
  body: string().optional()
})

export const NotificationsBalanceChangeSchema = object({
  data: NotificationsBalanceChangeDataSchema,
  notification: object({
    title: string(),
    body: string(),
    sound: string().optional(),
    android: object({
      channelId: nativeEnum(ChannelId).optional()
    }).optional()
  }).optional()
})

export type NotificationsBalanceChange = z.infer<
  typeof NotificationsBalanceChangeSchema
>

export type NotificationsBalanceChangeData = z.infer<
  typeof NotificationsBalanceChangeDataSchema
>

export enum BalanceChangeEvents {
  BALANCES_SPENT = 'BALANCES_SPENT',
  BALANCES_RECEIVED = 'BALANCES_RECEIVED',
  ALLOWANCE_APPROVED = 'ALLOWANCE_APPROVED'
}
