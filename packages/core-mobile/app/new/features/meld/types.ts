import { z } from 'zod'
import {
  SearchCountrySchema,
  SearchFiatCurrencySchema,
  SearchCryptoCurrencySchema,
  SearchServiceProviderSchema,
  SearchDefaultsByCountrySchema,
  SearchPaymentMethodsSchema,
  CreateCryptoQuoteSchema,
  CreateCryptoQuoteBodySchema,
  QuoteSchema,
  CreateSessionWidgetBodySchema,
  CreateSessionWidgetSchema,
  GetTradeLimitsSchema,
  MeldTransactionSchema
} from './services/schemas'
import { ServiceProviderCategories, ServiceProviders } from './consts'

export type Country = z.infer<typeof SearchCountrySchema>
export type FiatCurrency = z.infer<typeof SearchFiatCurrencySchema>
export type CryptoCurrency = z.infer<typeof SearchCryptoCurrencySchema>
export type ServiceProvider = z.infer<typeof SearchServiceProviderSchema>
export type SearchDefaultsByCountry = z.infer<
  typeof SearchDefaultsByCountrySchema
>
export type GetTradeLimits = z.infer<typeof GetTradeLimitsSchema>
export type SearchPaymentMethods = z.infer<typeof SearchPaymentMethodsSchema>
export type CreateCryptoQuote = z.infer<typeof CreateCryptoQuoteSchema>
export type Quote = z.infer<typeof QuoteSchema>

export type CreateCryptoQuoteParams = z.infer<
  typeof CreateCryptoQuoteBodySchema
>

export type CreateSessionWidgetParams = z.infer<
  typeof CreateSessionWidgetBodySchema
>

export type CreateSessionWidget = z.infer<typeof CreateSessionWidgetSchema>

export type MeldTransaction = z.infer<typeof MeldTransactionSchema>

export type MeldDefaultParams = {
  categories: ServiceProviderCategories[]
  serviceProviders?: string[]
  countries: string[]
  accountFilter?: boolean
}

export type CreateCryptoQuoteNotFoundError = {
  status: CreateCryptoQuoteErrorCode
  message: string
}

export type CreateCryptoQuoteError = {
  code: CreateCryptoQuoteErrorCode
  message: string
  serviceProviderDetails?: {
    serviceProvider: ServiceProviders
  }
  timestamp?: string
  requestId?: string
}

export enum CreateCryptoQuoteErrorCode {
  NOT_FOUND = 404,
  INCOMPATIBLE_REQUEST = 'INCOMPATIBLE_REQUEST'
}

export enum SessionTypes {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER = 'TRANSFER'
}
