import z, { object, string, nativeEnum, literal } from 'zod'
import { ChannelId } from 'services/notifications/channels'

export enum NewsEvents {
  PRODUCT_ANNOUNCEMENTS = 'PRODUCT_ANNOUNCEMENTS',
  OFFERS_AND_PROMOTIONS = 'OFFERS_AND_PROMOTIONS',
  MARKET_NEWS = 'MARKET_NEWS'
}

export enum BalanceChangeEvents {
  BALANCES_SPENT = 'BALANCES_SPENT',
  BALANCES_RECEIVED = 'BALANCES_RECEIVED',
  ALLOWANCE_APPROVED = 'ALLOWANCE_APPROVED'
}

export const BalanceChangeDataSchema = object({
  type: literal('balance').optional(), // TODO use correct type from backend
  event: nativeEnum(BalanceChangeEvents),
  title: string().optional(),
  body: string().optional(),
  accountAddress: string().startsWith('0x'),
  chainId: string(),
  transactionHash: string().startsWith('0x')
})

export const NewsDataSchema = object({
  type: literal('news').optional(), // TODO use correct type from backend
  event: nativeEnum(NewsEvents), // TODO use correct events from backend
  title: string().optional(),
  body: string().optional(),
  url: string()
})

export const NotificationPayloadSchema = object({
  data: BalanceChangeDataSchema.or(NewsDataSchema),
  notification: object({
    title: string(),
    body: string(),
    sound: string().optional(),
    android: object({
      channelId: nativeEnum(ChannelId).optional()
    })
      .optional()
      .describe(
        'Deprecated: this is for backward compatibility, remove when https://github.com/ava-labs/core-notification-sender-service/pull/62 is released to prod '
      ) //TODO
  }).optional()
})

export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>

export type BalanceChangeData = z.infer<typeof BalanceChangeDataSchema>

export type NewsData = z.infer<typeof NewsDataSchema>
