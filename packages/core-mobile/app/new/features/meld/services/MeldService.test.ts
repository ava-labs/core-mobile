import { CurrencySymbol } from 'store/settings/currency'
import { ServiceProviderCategories } from '../consts'
import { npRoutesUsdAvaxc } from './__fixtures__/networkPartner'
import { meldApiClient } from './apiClient'
import MeldService from './MeldService'

jest.mock('./apiClient', () => ({ meldApiClient: jest.fn() }))

const onramp = ServiceProviderCategories.CRYPTO_ONRAMP
const offramp = ServiceProviderCategories.CRYPTO_OFFRAMP

const client = {
  getPartners: jest.fn(),
  getCryptoCurrenciesNp: jest.fn(),
  getFiatCurrenciesNp: jest.fn(),
  getCountriesNp: jest.fn(),
  getDefaultsByCountryNp: jest.fn(),
  getPaymentMethodsNp: jest.fn(),
  getRoutes: jest.fn()
}

describe('MeldService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(meldApiClient as jest.Mock).mockReturnValue(client)
    MeldService.init()
  })

  it('searchServiceProviders returns the partners untouched', async () => {
    const partners = [{ serviceProvider: 'TRANSAK' }]
    client.getPartners.mockResolvedValue(partners)
    const result = await MeldService.searchServiceProviders({
      categories: [onramp]
    })
    expect(client.getPartners).toHaveBeenCalledWith({
      category: 'CRYPTO_ONRAMP'
    })
    expect(result).toBe(partners)
  })

  it('searchPaymentMethods uses routes when a token is selected', async () => {
    client.getRoutes.mockResolvedValue(npRoutesUsdAvaxc)
    const result = await MeldService.searchPaymentMethods({
      categories: [onramp],
      countries: ['US'],
      fiatCurrencies: [CurrencySymbol.USD],
      cryptoCurrencyCodes: ['AVAXC']
    })
    expect(client.getRoutes).toHaveBeenCalledWith({
      category: 'CRYPTO_ONRAMP',
      country: 'US',
      sourceCurrencyCode: 'USD',
      destinationCurrencyCode: 'AVAXC'
    })
    expect(client.getPaymentMethodsNp).not.toHaveBeenCalled()
    expect(result.map(m => m.paymentMethod)).toContain('CREDIT_DEBIT_CARD')
  })

  it('searchPaymentMethods falls back to the payment-methods endpoint without a token', async () => {
    client.getPaymentMethodsNp.mockResolvedValue([])
    await MeldService.searchPaymentMethods({
      categories: [onramp],
      countries: ['US'],
      fiatCurrencies: [CurrencySymbol.USD]
    })
    expect(client.getPaymentMethodsNp).toHaveBeenCalledWith({
      category: 'CRYPTO_ONRAMP',
      country: 'US',
      currencyCode: 'USD'
    })
    expect(client.getRoutes).not.toHaveBeenCalled()
  })

  it('getSellLimits puts the crypto first in the route', async () => {
    client.getRoutes.mockResolvedValue([])
    const result = await MeldService.getSellLimits({
      categories: [offramp],
      countries: ['US'],
      fiatCurrencies: [CurrencySymbol.USD],
      cryptoCurrencyCodes: ['AVAXC']
    })
    expect(client.getRoutes).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceCurrencyCode: 'AVAXC',
        destinationCurrencyCode: 'USD'
      })
    )
    expect(result).toEqual([])
  })

  it('limits and defaults resolve to [] without a country and never hit the client', async () => {
    await expect(
      MeldService.getPurchaseLimits({
        categories: [onramp],
        fiatCurrencies: [CurrencySymbol.USD],
        cryptoCurrencyCodes: ['AVAXC']
      })
    ).resolves.toEqual([])
    await expect(
      MeldService.searchDefaultsByCountry({ categories: [onramp] })
    ).resolves.toEqual([])
    expect(client.getRoutes).not.toHaveBeenCalled()
    expect(client.getDefaultsByCountryNp).not.toHaveBeenCalled()
  })

  it('searchCryptoCurrencies filters client-side by requested codes', async () => {
    client.getCryptoCurrenciesNp.mockResolvedValue([
      { currencyCode: 'AVAXC' },
      { currencyCode: 'BTC' }
    ])
    await expect(
      MeldService.searchCryptoCurrencies({
        categories: [onramp],
        cryptoCurrencies: ['BTC']
      })
    ).resolves.toEqual([{ currencyCode: 'BTC' }])
  })

  it('searchCryptoCurrencies returns every item when no codes are requested', async () => {
    const items = [{ currencyCode: 'AVAXC' }, { currencyCode: 'BTC' }]
    client.getCryptoCurrenciesNp.mockResolvedValue(items)
    await expect(
      MeldService.searchCryptoCurrencies({ categories: [onramp] })
    ).resolves.toEqual(items)
  })

  it('searchCryptoCurrencies drops items with a null code when filtering', async () => {
    client.getCryptoCurrenciesNp.mockResolvedValue([
      { currencyCode: null },
      { currencyCode: 'BTC' }
    ])
    await expect(
      MeldService.searchCryptoCurrencies({
        categories: [onramp],
        cryptoCurrencies: ['BTC']
      })
    ).resolves.toEqual([{ currencyCode: 'BTC' }])
    await expect(
      MeldService.searchCryptoCurrencies({ categories: [onramp] })
    ).resolves.toEqual([{ currencyCode: null }, { currencyCode: 'BTC' }])
  })

  it('searchFiatCurrencies and searchCountries filter by the requested codes', async () => {
    client.getFiatCurrenciesNp.mockResolvedValue([
      { currencyCode: 'USD' },
      { currencyCode: 'EUR' }
    ])
    await expect(
      MeldService.searchFiatCurrencies({
        categories: [onramp],
        fiatCurrencies: ['EUR']
      })
    ).resolves.toEqual([{ currencyCode: 'EUR' }])
    expect(client.getFiatCurrenciesNp).toHaveBeenCalledWith({
      category: 'CRYPTO_ONRAMP',
      country: undefined
    })

    client.getCountriesNp.mockResolvedValue([
      { countryCode: 'US' },
      { countryCode: 'DE' }
    ])
    await expect(
      MeldService.searchCountries({ categories: [onramp], countries: ['DE'] })
    ).resolves.toEqual([{ countryCode: 'DE' }])
  })

  it('getPurchaseLimits resolves to [] without a fiat currency and never calls routes', async () => {
    await expect(
      MeldService.getPurchaseLimits({
        categories: [onramp],
        countries: ['US'],
        cryptoCurrencyCodes: ['AVAXC']
      })
    ).resolves.toEqual([])
    expect(client.getRoutes).not.toHaveBeenCalled()
  })

  it('getPurchaseLimits resolves to [] without a crypto code and never calls routes', async () => {
    await expect(
      MeldService.getPurchaseLimits({
        categories: [onramp],
        countries: ['US'],
        fiatCurrencies: [CurrencySymbol.USD]
      })
    ).resolves.toEqual([])
    expect(client.getRoutes).not.toHaveBeenCalled()
    expect(client.getPaymentMethodsNp).not.toHaveBeenCalled()
  })
})
