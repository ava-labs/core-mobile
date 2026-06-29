import z, { object, string, nativeEnum, literal } from 'zod'
import { ChannelId } from 'services/notifications/channels'

export enum NotificationTypes {
  BALANCE_CHANGES = 'BALANCE_CHANGES',
  NEWS = 'NEWS',
  // Recurring swap (DCA) per-order progress. Subscribed via
  // `subscribeRecurringSwapNotifications`; payload shape comes from the
  // notification-sender webhook fanout (Sarp's PR #172 / #174). Backend
  // gates these behind the device's balance-notification preference and
  // owns subscription teardown — no client-side unsubscribe path.
  RECURRING_SWAP = 'RECURRING_SWAP'
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

// balance change notification
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

// Recurring swap execution / completion / failure notification. All numeric
// fields are sent as strings on the wire because FCM data payloads are
// `Record<string, string>`-shaped — the per-order delta is computed
// server-side (`executedOrders` / `remainingOrders` cursors). `reasonCode`
// is set only on `status === 'failed'` and carries a known wire code (e.g.
// `'2'` insufficient balance, `'3'` insufficient allowance); unknown codes
// are tolerated (forwarded to analytics but not surfaced as a push).
//
// `numberOfOrders === '-1'` is the SDK's unlimited sentinel (matches
// `RECURRING_UNLIMITED_ORDERS_SENTINEL`); the in-app row formats that as ∞.
//
// No `title` / `body` here — those live on the envelope (`notification`
// field) so the backend can localize / version the copy without the
// client schema needing to chase. The data block carries the machine-
// readable progress fields the in-app notification list + deep-link
// routing need.
export const RecurringSwapDataSchema = object({
  type: literal(NotificationTypes.RECURRING_SWAP),
  orderId: string(),
  owner: string().startsWith('0x'),
  chainId: string(),
  numberOfOrders: string(),
  executedOrders: string(),
  remainingOrders: string(),
  tokenIn: string().startsWith('0x'),
  tokenOut: string().startsWith('0x'),
  amountIn: string(),
  amountOut: string(),
  status: string(),
  reasonCode: string().optional()
})

// news notification covers the following:
// 1/ automated price alerts (fixed list of tokens):
//    uses urlV2 with internalId
// 2/ automated price alerts (favorite tokens):
//    uses urlV2 with internalId
// 3/ manually triggered notifications:
//    currently this uses url with internalId
//    but backend will update it to use urlV2 with internalId soon
export const NewsDataSchema = object({
  type: literal(NotificationTypes.NEWS),
  event: nativeEnum(NewsEvents),
  title: string(),
  body: string(),
  // TODO: completely remove url and use urlV2 only
  // after backend is updated to send urlV2
  url: string().optional(),
  urlV2: string().optional()
})

export const NotificationPayloadSchema = object({
  data: BalanceChangeDataSchema.or(NewsDataSchema).or(RecurringSwapDataSchema),
  notification: object({
    title: string(),
    body: string(),
    sound: string().optional(),
    android: object({
      channelId: nativeEnum(ChannelId).optional()
    })
      .optional()
      .describe(
        // Backend only sends this for SNS endpoints classified as UNKNOWN
        // (legacy clients). iOS foreground path still depends on it.
        'Legacy field for UNKNOWN-classified SNS endpoints.'
      )
  }).optional()
}).superRefine((payload, ctx) => {
  // BALANCE_CHANGES / NEWS carry their own `title` / `body` in the data block,
  // so they render on the Android data-only path without an envelope. A
  // RECURRING_SWAP data block intentionally omits title/body — those live only
  // on the `notification` envelope — so a data-only RECURRING_SWAP would pass
  // the shape check yet have nothing to display, failing at runtime in
  // FCMService. Require the envelope here so a misconfigured payload (backend/
  // config regression) fails `safeParse` and is logged + dropped by the
  // handlers' existing guard rather than reaching the display layer.
  if (
    payload.data.type === NotificationTypes.RECURRING_SWAP &&
    !payload.notification
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['notification'],
      message:
        'RECURRING_SWAP payloads must include a `notification` envelope (title/body).'
    })
  }
})

export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>

export type BalanceChangeData = z.infer<typeof BalanceChangeDataSchema>

export type NewsData = z.infer<typeof NewsDataSchema>

export type RecurringSwapData = z.infer<typeof RecurringSwapDataSchema>
