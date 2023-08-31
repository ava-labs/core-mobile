// The API reference:
// https://docs.open.DeFi.com/en/reference/api-models/portfolioitemobject

import { DeFiProtocolDetailTypes } from './types'

export type DeFiChainObject = {
  id: string
  community_id: number
  name: string
  native_token_id: string
  logo_url: string
  wrapped_token_id: string
  is_support_pre_exec: boolean
}

export type DeFiSimpleProtocolObject = DeFiProtocolBaseObject & {
  asset_usd_value: number
  debt_usd_value: number
  net_usd_value: number
}

export type DeFiProtocolBaseObject = {
  id: string
  chain: string
  name: string
  site_url: string
  logo_url: string
  has_supported_portfolio: boolean
  tvl: number
}

export type DeFiProtocolObject = DeFiProtocolBaseObject & {
  portfolio_item_list: DeFiPortfolioItemObject[]
}

export type DeFiTokenObject = {
  id: string
  chain: string
  name: string
  symbol: string
  display_symbol: string | null
  optimized_symbol: string
  decimals: number
  logo_url: string
  protocol_id: string
  price: number
  is_verified: boolean
  is_core: boolean
  is_wallet: boolean
  time_at: number
  amount: number
  raw_amount?: number
  raw_amount_str?: string
  claimable_amount?: number // for vesting tokens
}

export type DeFiPortfolioItemObject = {
  stats: {
    asset_usd_value: number
    debt_usd_value: number
    net_usd_value: number
  }
  update_at: number
  name: string
  detail_types: DeFiProtocolDetailTypes[]
  detail: {
    supply_token_list?: DeFiTokenObject[]
    reward_token_list?: DeFiTokenObject[]
    borrow_token_list?: DeFiTokenObject[]
    unlock_at?: number
    health_rate?: number
    debt_ratio?: number
    daily_unlock_amount?: number
    end_at?: number

    // Optional detail properties: https://docs.open.DeFi.com/en/reference/api-models/portfolioitemobject#locked-locked-position

    // For reward items:
    token_list?: DeFiTokenObject[]

    // For vesting protocols
    token?: DeFiTokenObject

    // For Options Seller / Options Buyer
    strike_token?: DeFiTokenObject
    underlying_token?: DeFiTokenObject
    collateral_token_list?: DeFiTokenObject[]

    // For perpetuals:
    pnl_usd_value?: number

    type?: number | string
    style?: 'American' | 'European'
    exercise_start_at?: number
    exercise_end_at?: number
    is_auto_exercise?: boolean
    exercise_profit?: number
    usd_value?: number
    description?: string
    expired_at?: number
    side?: 'Long' | 'Short'
    base_token?: DeFiTokenObject
    quote_token?: DeFiTokenObject
    position_token?: DeFiTokenObject
    margin_token?: DeFiTokenObject
    margin_rate?: { amount: number }
    leverage?: DeFiTokenObject
    daily_funding_rate?: DeFiTokenObject
    entry_price?: DeFiTokenObject
    mark_price?: DeFiTokenObject
    liquidation_price?: DeFiTokenObject
  }
}
