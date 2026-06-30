import { z } from 'zod'

/**
 * Notification type from backend
 */
export const NotificationTypeSchema = z.enum([
  'BALANCE_CHANGES',
  'PRICE_ALERTS',
  'NEWS',
  'RECURRING_SWAP'
])

/**
 * Balance change event types
 */
export const BalanceChangeEventSchema = z.enum([
  'BALANCES_SPENT',
  'BALANCES_RECEIVED',
  'BALANCES_TRANSFERRED',
  'ALLOWANCE_APPROVED'
])

/**
 * News event types
 */
export const NewsEventSchema = z.enum([
  'PRODUCT_ANNOUNCEMENTS',
  'OFFERS_AND_PROMOTIONS',
  'MARKET_NEWS',
  'PRICE_ALERTS'
])

/**
 * Balance changes transfer schema
 */
export const BalanceChangesTransferSchema = z.object({
  tokenSymbol: z.string(),
  amount: z.string(),
  partnerAddress: z.string()
})

/**
 * Balance changes metadata schema
 */
export const BalanceChangesMetadataSchema = z.object({
  event: BalanceChangeEventSchema,
  chainId: z.string(),
  chainName: z.string(),
  transactionHash: z.string(),
  accountAddress: z.string(),
  transfers: z.array(BalanceChangesTransferSchema).optional(),
  url: z.string()
})

/**
 * Price alerts metadata schema
 */
export const PriceAlertsMetadataSchema = z.object({
  tokenId: z.string(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  currentPrice: z.number(),
  priceChangePercent: z.number(),
  url: z.string()
})

/**
 * Price alert data item inside NEWS-wrapped price alerts
 */
export const PriceAlertDataItemSchema = z.object({
  tokenName: z.string(),
  currentPrice: z.number(),
  tokenId: z.string(),
  tokenSymbol: z.string(),
  priceChangePercent: z.number()
})

/**
 * NEWS-wrapped price alert metadata schema.
 * Backend sends price alerts as type:"NEWS" with event:"PRICE_ALERTS"
 * and price data in a data[] array.
 */
export const NewsPriceAlertMetadataSchema = z.object({
  event: z.literal('PRICE_ALERTS'),
  url: z.string(),
  data: z.array(PriceAlertDataItemSchema).min(1)
})

/**
 * News metadata schema
 */
export const NewsMetadataSchema = z.object({
  event: z.string(),
  url: z.string()
})

/**
 * Recurring swap (DCA) notification metadata. Mirrors the FCM push payload
 * Sarp's webhook fans out (PRs #172 / #174 on core-notification-sender):
 * machine-readable progress fields the in-app row uses to format its title /
 * subtitle + a status badge, and the `orderId` the deep link uses to
 * auto-expand the matching schedule. Numeric fields are coerced because the
 * two backend channels disagree on shape: the FCM push stringifies every
 * `data` value, while the notification-center history API returns raw JSON
 * (numbers stay numbers). `z.coerce` accepts both.
 *
 * `reasonCode` is set only on `status === 'failed'`; the push sends it as a
 * string (`String(reasonCode)`) but history sends the raw number — so it MUST
 * be coerced too. Without this, every failed notification (which always
 * carries a reasonCode) fails to parse on the history path, dropping the whole
 * `data` block and with it the failure badge + terminal-state detection. Known
 * codes are documented at the call site; unknown codes pass through so newer
 * backend codes don't fail parsing.
 */
export const RecurringSwapMetadataSchema = z.object({
  orderId: z.string(),
  owner: z.string(),
  chainId: z.coerce.number(),
  numberOfOrders: z.coerce.number(),
  executedOrders: z.coerce.number(),
  remainingOrders: z.coerce.number(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  amountOut: z.string(),
  status: z.string(),
  reasonCode: z.coerce.string().optional()
})

/**
 * Notification data payload from backend (generic for parsing)
 */
export const NotificationDataSchema = z
  .object({
    url: z.string().optional(),
    transactionHash: z.string().optional(),
    chainId: z.string().optional(),
    chainName: z.string().optional(),
    accountAddress: z.string().optional(),
    tokenSymbol: z.string().optional(),
    tokenName: z.string().optional(),
    tokenId: z.string().optional(),
    amount: z.string().optional(),
    event: z
      .union([BalanceChangeEventSchema, NewsEventSchema, z.string()])
      .optional(),
    partnerAddress: z.string().optional(),
    transfers: z.array(BalanceChangesTransferSchema).optional(),
    priceChangePercent: z.number().optional(),
    currentPrice: z.number().optional()
  })
  .passthrough()

/**
 * Backend notification response schema
 * Note: API returns notificationId/createdAt, we transform to id/timestamp
 */
export const NotificationResponseSchema = z.object({
  notificationId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  createdAt: z.number(),
  metadata: NotificationDataSchema.optional()
})

/**
 * List notifications response
 */
export const NotificationListResponseSchema = z.object({
  notifications: z.array(NotificationResponseSchema)
})

/**
 * Mark as read request body
 */
export const MarkAsReadRequestSchema = z.object({
  deviceArn: z.string(),
  notificationId: z.string()
})

/**
 * Mark all as read request body
 */
export const MarkAllAsReadRequestSchema = z.object({
  deviceArn: z.string()
})

/**
 * Generic success response
 * API returns { success: true, updatedCount?: number }
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  updatedCount: z.number().optional()
})
