import { object, record, string, number, z } from 'zod'
import {
  PaymentMethods,
  PaymentTypes,
  ServiceProviderCategories,
  ServiceProviders
} from '../consts'

const zodEnum = <T extends string>(arr: T[]): [T, ...T[]] => arr as [T, ...T[]]

const serviceProviderKeys = Object.keys(ServiceProviders) as Array<
  keyof typeof ServiceProviders
>

const paymentTypeKeys = Object.keys(PaymentTypes) as Array<
  keyof typeof PaymentTypes
>

const categoryKeys = Object.keys(ServiceProviderCategories) as Array<
  keyof typeof ServiceProviderCategories
>

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
  serviceProvider: z.enum(zodEnum(serviceProviderKeys)),
  name: string(),
  status: string(),
  categories: z.enum(zodEnum(categoryKeys)).array(),
  categoryStatuses: record(z.enum(zodEnum(categoryKeys)), string()),
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
  defaultPaymentMethods: z.nativeEnum(PaymentMethods).array()
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
  serviceProviderDetails: record(
    z.enum(zodEnum(serviceProviderKeys)),
    AmountDetailsSchema
  ).optional()
}).passthrough()

export const SearchPaymentMethodsSchema = object({
  paymentMethod: z.nativeEnum(PaymentMethods),
  name: string(),
  paymentType: z.enum(zodEnum(paymentTypeKeys)),
  logos: object({
    dark: string(),
    light: string()
  })
}).passthrough()
