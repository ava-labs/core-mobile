import { object, string, number, z } from 'zod'

const LogoSchema = object({
  dark: string().optional().nullable(),
  light: string().optional().nullable()
})
  .optional()
  .nullable()

export const NpPartnerSchema = object({
  serviceProvider: string(),
  name: string().optional().nullable(),
  logo: object({
    darkShort: string().optional().nullable(),
    lightShort: string().optional().nullable()
  })
    .optional()
    .nullable()
}).passthrough()

export const NpCurrencySchema = object({
  currencyCode: string(),
  name: string().optional().nullable(),
  chainCode: string().optional().nullable(),
  chainId: string().optional().nullable(),
  contract: string().optional().nullable()
}).passthrough()

export const NpCurrenciesResponseSchema = object({
  currencies: NpCurrencySchema.array()
}).passthrough()

export const NpCountrySchema = object({
  countryCode: string(),
  name: string().optional().nullable()
}).passthrough()

export const NpCountriesResponseSchema = object({
  countries: NpCountrySchema.array()
}).passthrough()

export const NpDefaultsSchema = object({
  paymentMethods: string().array().optional().nullable()
}).passthrough()

export const NpPaymentMethodSchema = object({
  method: string(),
  logo: LogoSchema
}).passthrough()

export const NpRouteLimitsSchema = object({
  currencyCode: string().optional().nullable(),
  min: number().optional().nullable(),
  max: number().optional().nullable()
}).passthrough()

export const NpRoutePaymentMethodSchema = object({
  name: string(),
  limits: NpRouteLimitsSchema.optional().nullable(),
  logo: LogoSchema
}).passthrough()

export const NpRouteSchema = object({
  partner: string(),
  paymentMethods: NpRoutePaymentMethodSchema.array().optional().nullable()
}).passthrough()

export type NpPartner = z.infer<typeof NpPartnerSchema>
export type NpCurrency = z.infer<typeof NpCurrencySchema>
export type NpCountry = z.infer<typeof NpCountrySchema>
export type NpDefaults = z.infer<typeof NpDefaultsSchema>
export type NpPaymentMethod = z.infer<typeof NpPaymentMethodSchema>
export type NpRoutePaymentMethod = z.infer<typeof NpRoutePaymentMethodSchema>
export type NpRoute = z.infer<typeof NpRouteSchema>
