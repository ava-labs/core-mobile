import { z } from 'zod'

/**
 * Notification type from backend
 */
export const NotificationTypeSchema = z.enum([
  'BALANCE_CHANGES',
  'PRICE_ALERTS',
  'NEWS'
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
 * News metadata schema
 */
export const NewsMetadataSchema = z.object({
  event: z.string(),
  url: z.string()
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
