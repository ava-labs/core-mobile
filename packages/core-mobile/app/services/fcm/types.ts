import z, { object, string, nativeEnum, literal } from 'zod'
import { ChannelId } from 'services/notifications/channels'

export enum NotificationTypes {
  BALANCE_CHANGES = 'BALANCE_CHANGES',
  NEWS = 'NEWS'
}

export enum NewsEvents {
  PRODUCT_ANNOUNCEMENTS = 'PRODUCT_ANNOUNCEMENTS',
  OFFERS_AND_PROMOTIONS = 'OFFERS_AND_PROMOTIONS',
  MARKET_NEWS = 'MARKET_NEWS',
  PRICE_ALERTS = 'PRICE_ALERTS'
}

export enum BalanceChangeEvents {
  BALANCES_SPENT = 'BALANCES_SPENT',
  BALANCES_RECEIVED = 'BALANCES_RECEIVED',
  BALANCES_TRANSFERRED = 'BALANCES_TRANSFERRED',
  ALLOWANCE_APPROVED = 'ALLOWANCE_APPROVED'
}

export const BalanceChangeDataSchema = object({
  type: literal(NotificationTypes.BALANCE_CHANGES),
  event: nativeEnum(BalanceChangeEvents),
  title: string(),
  body: string(),
  accountAddress: string().startsWith('0x'),
  chainId: string(),
  transactionHash: string().startsWith('0x'),
  url: string() // we need this url to deeplink to in-app browser or screens.
})

export const NewsDataSchema = object({
  type: literal(NotificationTypes.NEWS),
  event: nativeEnum(NewsEvents),
  title: string(),
  body: string(),
  url: string(),
  urlV2: string().optional() // New field for notifications with internalId
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
