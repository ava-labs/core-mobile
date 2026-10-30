import { z } from 'zod'
import { LocalTokenWithBalance } from 'store/balance'
import {
  CreateCryptoQuoteSchema,
  CreateCryptoQuoteBodySchema,
  QuoteSchema,
  CreateSessionWidgetBodySchema,
  CreateSessionWidgetSchema,
  MeldTransactionSchema
} from './services/transactionSchemas'
import { ServiceProviderCategories, ServiceProviders } from './consts'

export type Country = {
  countryCode: string
  name: string | null
}

export type FiatCurrency = {
  currencyCode: string
  name: string | null
}

export type CryptoCurrency = {
  currencyCode: string
  name: string | null
  chainCode: string | null
  chainName: string | null
  chainId: string | null
  contractAddress: string | null
}

export type ServiceProvider = {
  serviceProvider: string
  name: string | null
  logos: {
    darkShort: string | null
    lightShort: string | null
  }
}

export type SearchDefaultsByCountry = {
  countryCode: string
  defaultPaymentMethods: string[]
}

export type GetTradeLimits = {
  currencyCode: string
  minimumAmount: number
  maximumAmount: number
}

export type SearchPaymentMethods = {
  paymentMethod: string
  logos: {
    dark: string | null
    light: string | null
  }
}

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
  countries?: string[]
}

export type SearchFiatCurrenciesParams = MeldDefaultParams & {
  fiatCurrencies?: string[]
}

export type SearchCryptoCurrenciesParams = MeldDefaultParams & {
  cryptoCurrencies?: string[]
}

export type SearchRoutesParams = MeldDefaultParams & {
  fiatCurrencies?: string[]
  cryptoCurrencyCodes?: string[]
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

// https://docs.meld.io/docs/status-codes
export enum CreateCryptoQuoteErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NO_RESOURCE_FOUND = 404,
  INPUT_VALIDATION_FAILED = 422,
  FAILURE_TOO_EARLY = 425,
  TOO_MANY_REQUESTS = 429,
  UNEXPECTED_ISSUE = 500,
  INCOMPATIBLE_REQUEST = 'INCOMPATIBLE_REQUEST'
}

export enum SessionTypes {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER = 'TRANSFER'
}

export type CryptoQuotesError = {
  statusCode: CreateCryptoQuoteErrorCode
  message?: string
}

export type CryptoCurrencyWithBalance = CryptoCurrency & {
  tokenWithBalance: LocalTokenWithBalance
}
