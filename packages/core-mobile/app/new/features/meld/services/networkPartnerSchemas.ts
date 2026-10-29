import { object, string, number, boolean, unknown, z } from 'zod'

const LogoSchema = object({
  dark: string().optional().nullable(),
  light: string().optional().nullable()
})
  .optional()
  .nullable()

export const NpPartnerSchema = object({
  serviceProvider: string(),
  name: string().optional().nullable(),
  status: string().optional().nullable(),
  categories: string().array().optional().nullable(),
  capabilities: object({
    category: string().optional().nullable(),
    status: string().optional().nullable(),
    domains: string().array().optional().nullable()
  })
    .passthrough()
    .array()
    .optional()
    .nullable(),
  url: string().optional().nullable(),
  logo: object({
    dark: string().optional().nullable(),
    light: string().optional().nullable(),
    darkShort: string().optional().nullable(),
    lightShort: string().optional().nullable()
  })
    .optional()
    .nullable()
}).passthrough()

export const NpCurrencySchema = object({
  currencyCode: string(),
  name: string().optional().nullable(),
  type: string().optional().nullable(),
  chainCode: string().optional().nullable(),
  chainId: string().optional().nullable(),
  contract: string().optional().nullable(),
  symbol: string().optional().nullable()
}).passthrough()

export const NpCurrenciesResponseSchema = object({
  currencies: NpCurrencySchema.array()
}).passthrough()

export const NpCountrySchema = object({
  countryCode: string(),
  name: string().optional().nullable(),
  flag: string().optional().nullable(),
  subdivisions: string().array().optional().nullable()
}).passthrough()

export const NpCountriesResponseSchema = object({
  countries: NpCountrySchema.array()
}).passthrough()

export const NpDefaultsSchema = object({
  countryCode: string().optional().nullable(),
  category: string().optional().nullable(),
  currencyCode: string().optional().nullable(),
  paymentMethods: string().array().optional().nullable()
}).passthrough()

export const NpPaymentMethodSchema = object({
  method: string(),
  name: string().optional().nullable(),
  type: string().optional().nullable(),
  countryCode: string().optional().nullable(),
  providerMethod: string().optional().nullable(),
  logo: LogoSchema
}).passthrough()

export const NpRouteLimitsSchema = object({
  currencyCode: string().optional().nullable(),
  min: number().optional().nullable(),
  max: number().optional().nullable()
}).passthrough()

export const NpRoutePaymentMethodSchema = object({
  name: string(),
  paymentType: string().optional().nullable(),
  partnerMethodName: string().optional().nullable(),
  headlessSupported: boolean().optional().nullable(),
  limits: NpRouteLimitsSchema.optional().nullable(),
  logo: LogoSchema
}).passthrough()

export const NpRouteSchema = object({
  partner: string(),
  source: string().optional().nullable(),
  destination: string().optional().nullable(),
  paymentMethods: NpRoutePaymentMethodSchema.array().optional().nullable(),
  kycLimits: unknown().array().optional().nullable()
}).passthrough()

export type NpPartner = z.infer<typeof NpPartnerSchema>
export type NpCurrency = z.infer<typeof NpCurrencySchema>
export type NpCountry = z.infer<typeof NpCountrySchema>
export type NpDefaults = z.infer<typeof NpDefaultsSchema>
export type NpPaymentMethod = z.infer<typeof NpPaymentMethodSchema>
export type NpRoutePaymentMethod = z.infer<typeof NpRoutePaymentMethodSchema>
export type NpRoute = z.infer<typeof NpRouteSchema>
