// The API reference:
// https://docs.open.DeFi.com/en/reference/api-models/portfolioitemobject

import z, { boolean, literal, number, object, string } from 'zod'

export const DeFiChainSchema = object({
  id: string(),
  community_id: number(),
  name: string(),
  native_token_id: string(),
  logo_url: string(),
  wrapped_token_id: string(),
  is_support_pre_exec: boolean()
})
export type DeFiChainObject = z.infer<typeof DeFiChainSchema>

export const DeFiSimpleProtocolSchema = object({
  id: string(),
  chain: string(),
  name: string(),
  site_url: string().nullable(),
  logo_url: string().nullable(),
  has_supported_portfolio: boolean().nullable(),
  tvl: number().nullable(),
  asset_usd_value: number(),
  debt_usd_value: number(),
  net_usd_value: number()
})
export type DeFiSimpleProtocolObject = z.infer<typeof DeFiSimpleProtocolSchema>

export const DeFiTokenSchema = object({
  id: string(),
  chain: string(),
  name: string(),
  symbol: string(),
  display_symbol: string().nullable().optional(),
  optimized_symbol: string(),
  decimals: number().nullable(),
  logo_url: string().nullable(),
  protocol_id: string().nullable(),
  price: number(),
  is_verified: boolean().nullable(),
  is_core: boolean().nullable(),
  is_wallet: boolean().nullable(),
  time_at: number().nullable(),
  amount: number(),
  raw_amount: number().optional(),
  raw_amount_str: string().optional(),
  claimable_amount: number().optional() // for vesting tokens
})

const stats = object({
  asset_usd_value: number(),
  debt_usd_value: number(),
  net_usd_value: number()
})

export const DeFiPortfolioItemSchema = object({
  stats,
  update_at: number().nullable(),
  name: string(),
  detail_types: string().array(), // z.enum or z.nativeEnum are not working
  detail: object({
    supply_token_list: DeFiTokenSchema.array().optional(),
    reward_token_list: DeFiTokenSchema.array().optional(),
    borrow_token_list: DeFiTokenSchema.array().optional(),
    unlock_at: number().nullable().optional(),
    health_rate: number().optional(),
    debt_ratio: number().optional(),
    daily_unlock_amount: number().optional(),
    end_at: number().nullable().optional(),

    // Optional detail properties: https://docs.open.DeFi.com/en/reference/api-models/portfolioitemobject#locked-locked-position

    // For reward items:
    token_list: DeFiTokenSchema.array().optional(),

    // For vesting protocols
    token: DeFiTokenSchema.optional(),

    // For Options Seller / Options Buyer
    strike_token: DeFiTokenSchema.optional(),
    underlying_token: DeFiTokenSchema.optional(),
    collateral_token_list: DeFiTokenSchema.array().optional(),

    // For perpetuals:
    pnl_usd_value: number().optional(),

    type: number().or(string()).optional(),
    style: literal('American').or(literal('European')).optional(),
    exercise_start_at: number().nullable().optional(),
    exercise_end_at: number().nullable().optional(),
    is_auto_exercise: boolean().optional(),
    exercise_profit: number().optional(),
    usd_value: number().optional(),
    description: string().or(number()).optional(),
    expired_at: number().nullable().optional(),
    side: literal('Long').or(literal('Short')).optional(),
    base_token: DeFiTokenSchema.optional(),
    quote_token: DeFiTokenSchema.optional(),
    position_token: DeFiTokenSchema.optional(),
    margin_token: DeFiTokenSchema.optional(),
    margin_rate: object({ amount: number() }).optional(),
    leverage: DeFiTokenSchema.optional(),
    daily_funding_rate: DeFiTokenSchema.optional(),
    entry_price: DeFiTokenSchema.optional(),
    mark_price: DeFiTokenSchema.optional(),
    liquidation_price: DeFiTokenSchema.optional(),
    is_verified: boolean().nullable().optional()
  })
})

export const DeFiProtocolSchema = object({
  id: string(),
  chain: string(),
  name: string(),
  site_url: string(),
  logo_url: string(),
  has_supported_portfolio: boolean(),
  tvl: number(),
  portfolio_item_list: DeFiPortfolioItemSchema.array()
})
export type DeFiProtocolObject = z.infer<typeof DeFiProtocolSchema>
