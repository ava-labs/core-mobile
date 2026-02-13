import { zodToCamelCase } from 'utils/zodToCamelCase'
import z, { object, string, number, record } from 'zod'
import {
  DeFiChainSchema,
  DeFiPortfolioItemSchema,
  DeFiProtocolSchema,
  DeFiSimpleProtocolSchema,
  DeFiTokenSchema
} from './debankTypes'

export const DeFiChainCamelCase = zodToCamelCase(DeFiChainSchema)
export type DeFiChain = z.infer<typeof DeFiChainCamelCase>

export const DeFiSimpleProtocolCamelCase = zodToCamelCase(
  DeFiSimpleProtocolSchema
)
export type DeFiSimpleProtocol = z.infer<typeof DeFiSimpleProtocolCamelCase>

export const DeFiProtocolCamelCase = zodToCamelCase(DeFiProtocolSchema)
export type DeFiProtocol = z.infer<typeof DeFiProtocolCamelCase>

export const DeFiPortfolioItemCamelCase = zodToCamelCase(
  DeFiPortfolioItemSchema
)
export type DeFiPortfolioItem = z.infer<typeof DeFiPortfolioItemCamelCase>

const DeFiTokenCamelCase = zodToCamelCase(DeFiTokenSchema)
export type DeFiToken = z.infer<typeof DeFiTokenCamelCase>

type BaseDeFiItem = {
  type: DeFiProtocolDetailTypes
  name: string
  netUsdValue: number
}

// Represents a singular DeFi investment
export type DeFiItem =
  | DeFiCommonItem
  | DeFiLendingItem
  | DeFiVestingItem
  | DeFiRewardItem
  | DeFiPerpetualItem
  | DeFiInsuranceBuyerItem

// Groups DeFiItems under one name (e.g. 'Lending', 'Liquidity Pool')
export type DeFiItemGroup = {
  name: string
  items: DeFiItem[]
  totalUsdValue: number
}

export interface DeFiCommonItem extends BaseDeFiItem {
  type: DeFiProtocolDetailTypes.COMMON
  supplyTokens?: DeFiToken[]
  rewardTokens?: DeFiToken[]
}

export interface DeFiLendingItem extends BaseDeFiItem {
  type: DeFiProtocolDetailTypes.LENDING
  healthRate?: number
  supplyTokens?: DeFiToken[]
  borrowTokens?: DeFiToken[]
  rewardTokens?: DeFiToken[]
}

export interface DeFiVestingItem extends BaseDeFiItem {
  type: DeFiProtocolDetailTypes.VESTING
  token: DeFiToken & {
    claimableAmount?: number
  }
  dailyUnlockAmount?: number
  endAt?: number
}

export interface DeFiRewardItem extends BaseDeFiItem {
  type: DeFiProtocolDetailTypes.REWARD
  tokens?: DeFiToken[]
}

interface DeFiInsuranceItem extends BaseDeFiItem {
  expiredAt: number
  description: string
}

export interface DeFiInsuranceBuyerItem extends DeFiInsuranceItem {
  type: DeFiProtocolDetailTypes.INSURANCE_BUYER
}

export interface DeFiPerpetualItem extends BaseDeFiItem {
  type: DeFiProtocolDetailTypes.PERPETUALS
  positionToken: DeFiToken
  marginToken: DeFiToken
  profitUsdValue: number
  netUsdValue: number
}

export const ExchangeRateSchema = object({
  date: string(),
  usd: record(string(), number())
})
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>

export enum DeFiProtocolDetailTypes {
  COMMON = 'common',
  LOCKED = 'locked',
  LENDING = 'lending',
  LEVERAGED_FARMING = 'leveraged_farming',
  VESTING = 'vesting',
  REWARD = 'reward',
  OPTIONS_SELLER = 'options_seller',
  OPTIONS_BUYER = 'options_buyer',
  PERPETUALS = 'perpetuals',
  INSURANCE_SELLER = 'insurance_seller',
  INSURANCE_BUYER = 'insurance_buyer'
}
