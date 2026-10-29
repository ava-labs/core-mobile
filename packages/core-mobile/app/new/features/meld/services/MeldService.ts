import {
  Country,
  CreateCryptoQuote,
  CreateCryptoQuoteParams,
  CreateSessionWidget,
  CreateSessionWidgetParams,
  CryptoCurrency,
  FiatCurrency,
  MeldDefaultParams,
  MeldTransaction,
  SearchCryptoCurrenciesParams,
  SearchDefaultsByCountry,
  SearchFiatCurrenciesParams,
  SearchPaymentMethods,
  SearchRoutesParams,
  ServiceProvider
} from '../types'
import { ServiceProviderCategories } from '../consts'
import { meldApiClient } from './apiClient'
import { routesToPaymentMethods } from './networkPartnerAdapters'
import { NpRoute } from './networkPartnerSchemas'

const firstCategory = (
  categories: ServiceProviderCategories[]
): ServiceProviderCategories => {
  const [category] = categories
  if (!category) throw new Error('Meld category is required')
  return category
}

const onlyCodes = <T>(
  items: T[],
  getCode: (item: T) => string | null | undefined,
  codes?: string[]
): T[] =>
  codes
    ? items.filter(item => {
        const code = getCode(item)
        return code != null && codes.includes(code)
      })
    : items

class MeldService {
  #meldApiClient: ReturnType<typeof meldApiClient>

  init(sandbox?: boolean): void {
    this.#meldApiClient = meldApiClient(sandbox)
  }

  async searchCountries({
    categories,
    countries
  }: MeldDefaultParams): Promise<Country[]> {
    const result = await this.#meldApiClient.getCountriesNp({
      category: firstCategory(categories)
    })
    return onlyCodes(result, country => country.countryCode, countries)
  }

  async searchFiatCurrencies({
    categories,
    countries,
    fiatCurrencies
  }: SearchFiatCurrenciesParams): Promise<FiatCurrency[]> {
    const result = await this.#meldApiClient.getFiatCurrenciesNp({
      category: firstCategory(categories),
      country: countries?.[0]
    })
    return onlyCodes(result, c => c.currencyCode, fiatCurrencies)
  }

  async searchCryptoCurrencies({
    categories,
    countries,
    cryptoCurrencies
  }: SearchCryptoCurrenciesParams): Promise<CryptoCurrency[]> {
    const result = await this.#meldApiClient.getCryptoCurrenciesNp({
      category: firstCategory(categories),
      country: countries?.[0]
    })
    return onlyCodes(result, c => c.currencyCode, cryptoCurrencies)
  }

  async searchServiceProviders({
    categories
  }: MeldDefaultParams): Promise<ServiceProvider[]> {
    return this.#meldApiClient.getPartners({
      category: firstCategory(categories)
    })
  }

  async searchDefaultsByCountry({
    categories,
    countries
  }: MeldDefaultParams): Promise<SearchDefaultsByCountry[]> {
    const country = countries?.[0]
    if (!country) return []
    return this.#meldApiClient.getDefaultsByCountryNp({
      category: firstCategory(categories),
      country
    })
  }

  async searchPaymentMethods(
    params: SearchRoutesParams
  ): Promise<SearchPaymentMethods[]> {
    const country = params.countries?.[0]
    const fiat = params.fiatCurrencies?.[0]
    if (!country || !fiat) return []
    if (!params.cryptoCurrencyCodes?.[0])
      return this.#meldApiClient.getPaymentMethodsNp({
        category: firstCategory(params.categories),
        country,
        currencyCode: fiat
      })
    const routes = await this.#fetchRoutes(params)
    return routes ? routesToPaymentMethods(routes) : []
  }

  async searchRoutes(params: SearchRoutesParams): Promise<NpRoute[]> {
    return (await this.#fetchRoutes(params)) ?? []
  }

  async #fetchRoutes({
    categories,
    countries,
    fiatCurrencies,
    cryptoCurrencyCodes
  }: SearchRoutesParams): Promise<NpRoute[] | undefined> {
    const category = firstCategory(categories)
    const country = countries?.[0]
    const fiat = fiatCurrencies?.[0]
    const crypto = cryptoCurrencyCodes?.[0]
    if (!country || !fiat || !crypto) return undefined
    const isOfframp = category === ServiceProviderCategories.CRYPTO_OFFRAMP
    return this.#meldApiClient.getRoutes({
      category,
      country,
      sourceCurrencyCode: isOfframp ? crypto : fiat,
      destinationCurrencyCode: isOfframp ? fiat : crypto
    })
  }

  async createCryptoQuote({
    serviceProviders,
    sourceAmount,
    walletAddress,
    countryCode,
    sourceCurrencyCode,
    destinationCurrencyCode,
    paymentMethodType,
    subdivision
  }: CreateCryptoQuoteParams): Promise<CreateCryptoQuote | undefined> {
    const body = {
      serviceProviders,
      countryCode,
      sourceCurrencyCode,
      destinationCurrencyCode,
      sourceAmount,
      walletAddress,
      subdivision,
      paymentMethodType
    }
    return this.#meldApiClient.createCryptoQuotes(body)
  }

  async createSessionWidget({
    sessionType,
    sessionData: {
      serviceProvider,
      redirectUrl,
      redirectFlow,
      sourceAmount,
      walletAddress,
      countryCode,
      sourceCurrencyCode,
      destinationCurrencyCode,
      paymentMethodType
    }
  }: CreateSessionWidgetParams): Promise<CreateSessionWidget | undefined> {
    const body = {
      sessionType,
      sessionData: {
        serviceProvider,
        redirectUrl,
        redirectFlow,
        countryCode,
        sourceCurrencyCode,
        destinationCurrencyCode,
        paymentMethodType,
        sourceAmount,
        walletAddress
      }
    }
    return this.#meldApiClient.createSessionWidget(body)
  }

  // Fetch transaction by session id
  // - sessionId is created in the createSessionWidget function, and the transaction has not been created yet
  // - user has to completed the kyc or signed into the service provider platform
  // - Meld has webhook setup to get the transaction details from the service provider
  // - this endpoint is used to ask Meld to fetch the transaction details from the service provider immediately
  async fetchTrasactionBySessionId({
    sessionId
  }: {
    sessionId: string
  }): Promise<MeldTransaction | undefined> {
    return await this.#meldApiClient.fetchTransactionBySessionId(sessionId)
  }
}

export default new MeldService()
