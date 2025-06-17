import { object, record, string, number } from 'zod'

export const SearchCountrySchema = object({
  countryCode: string(),
  name: string(),
  flagImageUrl: string().nullable(),
  regions: string().array().nullable()
}).passthrough()

export const SearchFiatCurrencySchema = object({
  countryCode: string(),
  name: string(),
  symbolImageUrl: string().nullable()
}).passthrough()

export const SearchCryptoCurrencySchema = object({
  currencyCode: string().nullable().optional(),
  name: string(),
  chainCode: string(),
  chainName: string(),
  chainId: string().nullable(),
  contractAddress: string().nullable(),
  symbolImageUrl: string().nullable()
}).passthrough()

export const SearchServiceProviderSchema = object({
  serviceProvider: string(),
  name: string(),
  status: string(),
  categories: string().array(),
  categoryStatuses: record(string(), string()),
  websiteUrl: string().nullable(),
  customerSupportUrl: string().nullable(),
  logos: object({
    dark: string(),
    light: string(),
    darkShort: string(),
    lightShort: string()
  })
}).passthrough()

export const SearchDefaultsByCountrySchema = object({
  countryCode: string(),
  defaultCurrencyCode: string(),
  defaultPaymentMethods: string().array()
}).passthrough()

const AmountDetailsSchema = object({
  defaultAmount: number().optional(),
  minimumAmount: number(),
  maximumAmount: number()
})

export const GetPurchaseLimitsSchema = object({
  countryCode: string().optional(),
  chainCode: string().optional(),
  defaultAmount: number().optional(),
  minimumAmount: number(),
  maximumAmount: number(),
  meldDetails: AmountDetailsSchema.optional(),
  serviceProviderDetails: record(string(), AmountDetailsSchema).optional()
}).passthrough()
