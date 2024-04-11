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

const ethereumDynamicFeeAssetConfigSchema = assetBaseSchema.extend({
  assetType: z.literal(AssetType.ERC20),
  avaxPromotionDollarThreshold: z.number(),
  avaxPromotionAmount: z.string(),
  chainlinkFeedAddress: z.string().optional(),
  chainlinkFeedNetwork: z.string().optional(),
  ipfsHash: z.string().optional(),
  transferGasLimit: z.number().optional(),
  nativeContractAddress: z.string(),
  wrappedContractAddress: z.string(),
  wrappedNetwork: z.string(),
  deprecatedTokenContractAddress: z.string().optional(),
  offboardFeeProcessThreshold: z.string(),
  offboardFeeConfiguration: z.object({
    feePercentage: z.number(),
    feePercentageDecimals: z.number(),
    maximumFeeDollars: z.number(),
    minimumFeeDollars: z.number()
  }),
  onboardFeeConfiguration: z.object({
    feePercentage: z.number(),
    feePercentageDecimals: z.number(),
    maximumFeeDollars: z.number(),
    minimumFeeDollars: z.number()
  })
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

const bitcoinDynamicFeeConfigAssetSchema = assetBaseSchema.extend({
  assetType: z.literal(AssetType.BTC),
  additionalTxFeeAmount: z.number(),
  avaxPromotionAmount: z.string(),
  avaxPromotionDollarThreshold: z.number(),
  bech32AddressPrefix: z.string(),
  operatorAddress: z.string(),
  privateKeyPrefix: z.string(),
  reserveBalanceHighWaterMark: z.number(),
  reserveBalanceLowWaterMark: z.number(),
  targetChangeAmount: z.number(),
  wrappedContractAddress: z.string(),
  wrappedNetwork: z.string(),
  offboardFeeConfiguration: z.object({
    feePercentage: z.number(),
    feePercentageDecimals: z.number(),
    maximumFeeDollars: z.number(),
    minimumFeeDollars: z.number()
  }),
  onboardFeeConfiguration: z.object({
    feePercentage: z.number(),
    feePercentageDecimals: z.number(),
    maximumFeeDollars: z.number(),
    minimumFeeDollars: z.number()
  })
})

const assetSchema = z.union([
  ethereumDynamicFeeAssetConfigSchema,
  ethereumConfigAssetSchema,
  nativeAssetSchema,
  bitcoinConfigAssetSchema,
  bitcoinDynamicFeeConfigAssetSchema
])

const paramsSchema = z.tuple([
  blockchainSchema,
  z.string().describe('amount'),
  assetSchema
])

const approveDataSchema = z.object({
  amountStr: z.string(),
  asset: assetSchema,
  currentBlockchain: blockchainSchema,
  maxFeePerGas: z.bigint(),
  maxPriorityFeePerGas: z.bigint().optional()
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
