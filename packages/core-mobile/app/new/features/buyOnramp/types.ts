import { z } from 'zod'
import {
  SearchCountrySchema,
  SearchFiatCurrencySchema,
  SearchCryptoCurrencySchema,
  SearchServiceProviderSchema,
  SearchDefaultsByCountrySchema,
  GetPurchaseLimitsSchema,
  SearchPaymentMethodsSchema,
  CreateCryptoQuoteSchema,
  CreateCryptoQuoteBodySchema,
  QuoteSchema
} from './services/schemas'
import { ServiceProviderCategories } from './consts'

export type Country = z.infer<typeof SearchCountrySchema>
export type FiatCurrency = z.infer<typeof SearchFiatCurrencySchema>
export type CryptoCurrency = z.infer<typeof SearchCryptoCurrencySchema>
export type ServiceProvider = z.infer<typeof SearchServiceProviderSchema>
export type SearchDefaultsByCountry = z.infer<
  typeof SearchDefaultsByCountrySchema
>
export type GetPurchaseLimits = z.infer<typeof GetPurchaseLimitsSchema>
export type SearchPaymentMethods = z.infer<typeof SearchPaymentMethodsSchema>
export type CreateCryptoQuote = z.infer<typeof CreateCryptoQuoteSchema>
export type Quote = z.infer<typeof QuoteSchema>

export type CreateCryptoQuoteParams = z.infer<
  typeof CreateCryptoQuoteBodySchema
>

const CreateCryptoQuoteWithoutCountryCodeSchema =
  CreateCryptoQuoteBodySchema.omit({
    countryCode: true
  })

export type CreateCryptoQuoteWithoutCountryCodeParams = z.infer<
  typeof CreateCryptoQuoteWithoutCountryCodeSchema
>

export type MeldDefaultParams = {
  categories: ServiceProviderCategories[]
  serviceProviders?: string[]
  countries: string[]
  accountFilter?: boolean
}
