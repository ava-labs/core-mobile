// The API reference:
// https://docs.open.DeFi.com/en/reference/api-models/portfolioitemobject

import { literal, number, object, string } from 'zod'

export const DeFiChainSchema = object({
  id: string(),
  community_id: number(),
  name: string(),
  native_token_id: string(),
  logo_url: string()
    .nullable()
    .transform(v => v ?? undefined)
})

export const DeFiSimpleProtocolSchema = object({
  id: string(),
  chain: string(),
  name: string().nullable(),
  site_url: string()
    .nullable()
    .transform(v => v ?? undefined),
  logo_url: string()
    .nullable()
    .transform(v => v ?? undefined),
  asset_usd_value: number(),
  debt_usd_value: number(),
  net_usd_value: number()
})

export const DeFiTokenSchema = object({
  id: string(),
  chain: string(),
  name: string()
    .nullable()
    .transform(v => v ?? undefined),
  symbol: string()
    .nullable()
    .transform(v => v ?? undefined),
  decimals: number()
    .nullable()
    .transform(v => v ?? undefined),
  logo_url: string()
    .nullable()
    .optional()
    .transform(v => v ?? undefined),
  protocol_id: string(),
  price: number(),
  time_at: number()
    .nullable()
    .optional()
    .transform(v => v ?? undefined),
  amount: number(),
  claimable_amount: number().optional() // for vesting tokens
})

const stats = object({
  asset_usd_value: number(),
  debt_usd_value: number(),
  net_usd_value: number()
})

export const DeFiPortfolioItemSchema = object({
  stats,
  update_at: number()
    .nullable()
    .optional()
    .transform(v => v ?? undefined),
  name: string(),
  detail_types: string().array(),
  detail: object({
    supply_token_list: DeFiTokenSchema.array().optional(),
    reward_token_list: DeFiTokenSchema.array().optional(),
    borrow_token_list: DeFiTokenSchema.array().optional(),
    health_rate: number()
      .nullable()
      .optional()
      .transform(v => v ?? undefined),
    end_at: number()
      .nullable()
      .optional()
      .transform(v => v ?? undefined),

    // Optional detail properties: https://docs.open.DeFi.com/en/reference/api-models/portfolioitemobject#locked-locked-position

    // For reward items:
    token_list: DeFiTokenSchema.array().optional(),

    // For vesting protocols
    token: DeFiTokenSchema.optional(),

    // For perpetuals:
    pnl_usd_value: number().optional(),

    type: number().or(string()).optional(),
    style: literal('American').or(literal('European')).optional(),
    usd_value: number().optional(),
    description: string()
      .or(number())
      .nullable()
      .optional()
      .transform(v => v ?? undefined),
    expired_at: number()
      .nullable()
      .optional()
      .transform(v => v ?? undefined),
    side: literal('Long').or(literal('Short')).optional(),
    position_token: DeFiTokenSchema.optional(),
    margin_token: DeFiTokenSchema.optional()
  })
})

export const DeFiProtocolSchema = object({
  id: string(),
  chain: string(),
  name: string(),
  site_url: string()
    .nullable()
    .transform(v => v ?? undefined),
  logo_url: string()
    .nullable()
    .transform(v => v ?? undefined),
  portfolio_item_list: DeFiPortfolioItemSchema.array()
})
