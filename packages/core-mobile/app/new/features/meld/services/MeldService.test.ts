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
  getCryptoCurrencies: jest.fn(),
  getFiatCurrencies: jest.fn(),
  getCountries: jest.fn(),
  getDefaultsByCountry: jest.fn(),
  getPaymentMethods: jest.fn(),
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

  it('searchPaymentMethods reads the payment-methods endpoint', async () => {
    client.getPaymentMethods.mockResolvedValue([])
    await MeldService.searchPaymentMethods({
      categories: [onramp],
      countries: ['US'],
      fiatCurrencies: [CurrencySymbol.USD]
    })
    expect(client.getPaymentMethods).toHaveBeenCalledWith({
      category: 'CRYPTO_ONRAMP',
      country: 'US',
      currencyCode: 'USD'
    })
  })

  it('searchPaymentMethods resolves to [] without a country or fiat currency', async () => {
    await expect(
      MeldService.searchPaymentMethods({
        categories: [onramp],
        fiatCurrencies: [CurrencySymbol.USD]
      })
    ).resolves.toEqual([])
    await expect(
      MeldService.searchPaymentMethods({
        categories: [onramp],
        countries: ['US']
      })
    ).resolves.toEqual([])
    expect(client.getPaymentMethods).not.toHaveBeenCalled()
  })

  it('searchRoutes puts the crypto first in the off-ramp route', async () => {
    client.getRoutes.mockResolvedValue([])
    const result = await MeldService.searchRoutes({
      categories: [offramp],
      countries: ['US'],
      fiatCurrencies: [CurrencySymbol.USD],
      cryptoCurrencyCodes: ['AVAXC']
    })
    expect(client.getRoutes).toHaveBeenCalledWith({
      category: 'CRYPTO_OFFRAMP',
      country: 'US',
      sourceCurrencyCode: 'AVAXC',
      destinationCurrencyCode: 'USD'
    })
    expect(result).toEqual([])
  })

  it('searchRoutes puts the fiat first in the on-ramp route and returns the routes', async () => {
    client.getRoutes.mockResolvedValue(npRoutesUsdAvaxc)
    const result = await MeldService.searchRoutes({
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
    expect(result).toBe(npRoutesUsdAvaxc)
  })

  it('routes and defaults resolve to [] without a country and never hit the client', async () => {
    await expect(
      MeldService.searchRoutes({
        categories: [onramp],
        fiatCurrencies: [CurrencySymbol.USD],
        cryptoCurrencyCodes: ['AVAXC']
      })
    ).resolves.toEqual([])
    await expect(
      MeldService.searchDefaultsByCountry({ categories: [onramp] })
    ).resolves.toEqual([])
    expect(client.getRoutes).not.toHaveBeenCalled()
    expect(client.getDefaultsByCountry).not.toHaveBeenCalled()
  })

  it('searchCryptoCurrencies filters client-side by requested codes', async () => {
    client.getCryptoCurrencies.mockResolvedValue([
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
    client.getCryptoCurrencies.mockResolvedValue(items)
    await expect(
      MeldService.searchCryptoCurrencies({ categories: [onramp] })
    ).resolves.toEqual(items)
  })

  it('searchCryptoCurrencies drops items with a null code when filtering', async () => {
    client.getCryptoCurrencies.mockResolvedValue([
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
    client.getFiatCurrencies.mockResolvedValue([
      { currencyCode: 'USD' },
      { currencyCode: 'EUR' }
    ])
    await expect(
      MeldService.searchFiatCurrencies({
        categories: [onramp],
        fiatCurrencies: ['EUR']
      })
    ).resolves.toEqual([{ currencyCode: 'EUR' }])
    expect(client.getFiatCurrencies).toHaveBeenCalledWith({
      category: 'CRYPTO_ONRAMP',
      country: undefined
    })

    client.getCountries.mockResolvedValue([
      { countryCode: 'US' },
      { countryCode: 'DE' }
    ])
    await expect(
      MeldService.searchCountries({ categories: [onramp], countries: ['DE'] })
    ).resolves.toEqual([{ countryCode: 'DE' }])
  })

  it('searchRoutes resolves to [] without a fiat currency and never calls routes', async () => {
    await expect(
      MeldService.searchRoutes({
        categories: [onramp],
        countries: ['US'],
        cryptoCurrencyCodes: ['AVAXC']
      })
    ).resolves.toEqual([])
    expect(client.getRoutes).not.toHaveBeenCalled()
  })

  it('searchRoutes resolves to [] without a crypto code and never calls routes', async () => {
    await expect(
      MeldService.searchRoutes({
        categories: [onramp],
        countries: ['US'],
        fiatCurrencies: [CurrencySymbol.USD]
      })
    ).resolves.toEqual([])
    expect(client.getRoutes).not.toHaveBeenCalled()
    expect(client.getPaymentMethods).not.toHaveBeenCalled()
  })
})
