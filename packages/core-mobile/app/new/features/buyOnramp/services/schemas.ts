import { object, record, string } from 'zod'

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
  countryCode: string().nullable().optional(),
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
