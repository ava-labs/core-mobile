import { zodToCamelCase } from 'utils/zodToCamelCase'
import z, {
  array,
  discriminatedUnion,
  literal,
  number,
  object,
  record,
  string,
  union
} from 'zod'

const Features = object({
  type: string(),
  feature_id: string(),
  description: string(),
  address: string().optional()
})

const TransactionValidationSchema = object({
  result_type: string(),
  description: string().optional(),
  reason: string().optional(),
  classification: string().optional(),
  features: Features.array()
})

const ERC20TokenDetailsSchema = object({
  name: string().optional(),
  symbol: string().optional(),
  address: string(),
  logo_url: string().optional(),
  type: literal('ERC20'),
  decimals: number()
})

const ERC115TokenDetailsSchema = object({
  name: string().optional(),
  symbol: string().optional(),
  address: string(),
  logo_url: string().optional(),
  type: literal('ERC1155')
})

const ERC721TokenDetailsSchema = object({
  name: string().optional(),
  symbol: string().optional(),
  address: string(),
  logo_url: string().optional(),
  type: literal('ERC721')
})

const NONERCTokenDetailsSchema = object({
  name: string().optional(),
  symbol: string().optional(),
  address: string(),
  logo_url: string().optional(),
  type: literal('NONERC')
})

const NativeAssetDetailsSchema = object({
  name: string().optional(),
  symbol: string().optional(),
  logo_url: string(),
  type: literal('NATIVE'),
  chain_name: string(),
  chain_id: number(),
  decimals: number()
})

const AssetSchema = discriminatedUnion('type', [
  ERC20TokenDetailsSchema,
  ERC115TokenDetailsSchema,
  ERC721TokenDetailsSchema,
  NONERCTokenDetailsSchema,
  NativeAssetDetailsSchema
])

const AssetCamelCase = zodToCamelCase(AssetSchema)

export type Asset = z.infer<typeof AssetCamelCase>

const ERC1155DiffSchema = object({
  usd_price: number().optional(),
  summary: string().optional(),
  token_id: number(),
  raw_value: string(),
  logo_url: string().optional()
})

const ERC721DiffSchema = object({
  usd_price: string().optional(),
  summary: string().optional(),
  token_id: number(),
  logo_url: string().optional()
})

const ERC20DiffSchema = object({
  usd_price: string().optional(),
  summary: string().optional(),
  value: string().optional(),
  raw_value: string()
})

const NativeDiff = object({
  usd_price: string().optional(),
  summary: string().optional(),
  value: string().optional(),
  raw_value: string()
})

const DiffSchema = union([
  ERC20DiffSchema,
  ERC1155DiffSchema,
  ERC721DiffSchema,
  NativeDiff
])

const AssetDiffSchema = object({
  asset: AssetSchema,
  in: array(DiffSchema),
  out: array(DiffSchema)
})

const DiffCamelCase = zodToCamelCase(DiffSchema)

export type Diff = z.infer<typeof DiffCamelCase>

const TotalUSDDiffSchema = object({
  in: string(),
  out: string(),
  total: string()
})

const AddressDetailSchema = object({
  name_tag: string().optional(),
  contract_name: string().optional()
})

const TransactionSimulationSchema = object({
  assets_diffs: record(array(AssetDiffSchema)),
  total_usd_diff: record(TotalUSDDiffSchema),
  address_details: record(AddressDetailSchema),
  account_summary: object({
    assets_diffs: array(AssetDiffSchema),
    total_usd_diff: TotalUSDDiffSchema.optional()
  })
})

export const TransactionValidationSimulationSchema = object({
  validation: TransactionValidationSchema,
  simulation: TransactionSimulationSchema,
  block: number().optional(),
  chain: string().optional()
})

export const TransactionValidationSimulationCamelCase = zodToCamelCase(
  TransactionValidationSimulationSchema
)

export type TransactionValidationResult = z.infer<
  typeof TransactionValidationSimulationCamelCase
>

const TransactionSimulationCamelCase = zodToCamelCase(
  TransactionSimulationSchema
)

export type TransactionSimulationResult = z.infer<
  typeof TransactionSimulationCamelCase
>
