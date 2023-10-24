import { AssetType, Blockchain } from '@avalabs/bridge-sdk'
import { z } from 'zod'

const assetTypeSchema = z.nativeEnum(AssetType)

const blockchainSchema = z.nativeEnum(Blockchain)

const assetBaseSchema = z.object({
  symbol: z.string(),
  tokenName: z.string(),
  assetType: assetTypeSchema,
  nativeNetwork: blockchainSchema,
  denomination: z.number()
})

const ethereumConfigAssetSchema = assetBaseSchema.extend({
  assetType: z.literal(AssetType.ERC20),
  avaxPromotionDollarThreshold: z.number(),
  avaxPromotionAmount: z.string(),
  chainlinkFeedAddress: z.string().optional(),
  maximumOnboardFee: z.string().optional(),
  nativeContractAddress: z.string(),
  offboardFeeDollars: z.number(),
  offboardFeeProcessThreshold: z.string(),
  onboardFeePercentage: z.string().optional(),
  wrappedContractAddress: z.string(),
  wrappedNetwork: z.string(),
  deprecatedTokenContractAddress: z.string().optional()
})

const nativeAssetSchema = assetBaseSchema.extend({
  assetType: z.literal(AssetType.NATIVE),
  wrappedAssetSymbol: z.string(),
  coingeckoId: z.string()
})

const bitcoinConfigAssetSchema = assetBaseSchema.extend({
  assetType: z.literal(AssetType.BTC),
  additionalTxFeeAmount: z.number(),
  avaxPromotionAmount: z.string(),
  avaxPromotionDollarThreshold: z.number(),
  bech32AddressPrefix: z.string(),
  offboardFeeDollars: z.number(),
  onboardFeeDollars: z.number(),
  operatorAddress: z.string(),
  privateKeyPrefix: z.string(),
  reserveBalanceHighWaterMark: z.number(),
  reserveBalanceLowWaterMark: z.number(),
  targetChangeAmount: z.number(),
  wrappedContractAddress: z.string(),
  wrappedNetwork: z.string()
})

const assetSchema = z.union([
  ethereumConfigAssetSchema,
  nativeAssetSchema,
  bitcoinConfigAssetSchema
])

const paramsSchema = z.tuple([
  blockchainSchema,
  z.string().describe('amount'),
  assetSchema
])

const approveDataSchema = z.object({
  amountStr: z.string(),
  asset: assetSchema,
  currentBlockchain: blockchainSchema
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
