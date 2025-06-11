import { z } from 'zod'
import {
  SearchCountrySchema,
  SearchFiatCurrencySchema,
  SearchCryptoCurrencySchema,
  SearchServiceProviderSchema
} from './services/schemas'
import { ServiceProviderCategories } from './consts'

export type Country = z.infer<typeof SearchCountrySchema>
export type FiatCurrency = z.infer<typeof SearchFiatCurrencySchema>
export type CryptoCurrency = z.infer<typeof SearchCryptoCurrencySchema>
export type ServiceProvider = z.infer<typeof SearchServiceProviderSchema>

export type MeldDefaultParams = {
  categories: ServiceProviderCategories[]
  serviceProviders?: string[]
  countries: string[]
  accountFilter?: boolean
}
