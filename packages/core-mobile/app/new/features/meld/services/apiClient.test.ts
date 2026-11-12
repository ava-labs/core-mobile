import Logger from 'utils/Logger'
import { fetchJson } from 'utils/api/common/fetchWithValidation'
import { ServiceProviderCategories } from '../consts'
import { CreateCryptoQuoteParams } from '../types'
import { npRoutesUsdAvaxc } from './__fixtures__/networkPartner'
import { meldApiClient } from './apiClient'
import { MELD_API_VERSION, MELD_VERSION_HEADER } from './networkPartnerPaths'

jest.mock('utils/api/common/fetchWithValidation', () => ({
  ...jest.requireActual('utils/api/common/fetchWithValidation'),
  fetchJson: jest.fn()
}))

const mockFetchJson = fetchJson as jest.Mock

const versionHeaders = { [MELD_VERSION_HEADER]: MELD_API_VERSION }

const httpError = (status: number): Error & { response: { status: number } } =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status } })

const expectGet = (suffix: string): void => {
  const [url, options, schema] = mockFetchJson.mock.calls[0]
  expect(url.slice(-suffix.length)).toBe(suffix)
  expect(options).toEqual({ method: 'GET', headers: versionHeaders })
  expect(schema).toBeTruthy()
}

describe('meldApiClient network-partner', () => {
  beforeEach(() => {
    mockFetchJson.mockReset()
    jest.spyOn(Logger, 'warn').mockImplementation(() => undefined)
  })

  it('resolves defaults to [] when the category is not live (404)', async () => {
    mockFetchJson.mockRejectedValue(httpError(404))
    await expect(
      meldApiClient().getDefaultsByCountry({
        category: ServiceProviderCategories.CRYPTO_OFFRAMP,
        country: 'US'
      })
    ).resolves.toEqual([])
    expect(Logger.warn).toHaveBeenCalledTimes(1)
  })

  it('rethrows other defaults errors', async () => {
    mockFetchJson.mockRejectedValue(httpError(500))
    await expect(
      meldApiClient().getDefaultsByCountry({
        category: ServiceProviderCategories.CRYPTO_OFFRAMP,
        country: 'US'
      })
    ).rejects.toThrow('HTTP 500')
  })

  it('builds the defaults path from country and category', async () => {
    mockFetchJson.mockResolvedValue({ countryCode: 'US' })
    await meldApiClient().getDefaultsByCountry({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US'
    })
    expectGet('/proxy/meld/network-partner/defaults/US/CRYPTO_ONRAMP')
  })

  it('encodes path segments', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient().getRoutes({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      sourceCurrencyCode: 'U/D',
      destinationCurrencyCode: 'AVAXC'
    })
    expectGet(
      '/proxy/meld/network-partner/supported/routes/CRYPTO_ONRAMP/US/U%2FD/AVAXC'
    )
  })

  it('builds the routes path from category, country and currencies', async () => {
    mockFetchJson.mockResolvedValue(npRoutesUsdAvaxc)
    await meldApiClient().getRoutes({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      sourceCurrencyCode: 'USD',
      destinationCurrencyCode: 'AVAXC'
    })
    expectGet(
      '/proxy/meld/network-partner/supported/routes/CRYPTO_ONRAMP/US/USD/AVAXC'
    )
  })

  it('builds the currencies url in buildQueryString order', async () => {
    mockFetchJson.mockResolvedValue({ currencies: [] })
    await meldApiClient().getCryptoCurrencies({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      partner: 'STRIPE'
    })
    expectGet(
      '/proxy/meld/network-partner/supported/currencies?type=CRYPTO&category=CRYPTO_ONRAMP&country=US&partner=STRIPE'
    )
  })

  it('defaults partners to LIVE status', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient().getPartners({
      category: ServiceProviderCategories.CRYPTO_ONRAMP
    })
    expectGet(
      '/proxy/meld/network-partner/partners?status=LIVE&category=CRYPTO_ONRAMP'
    )
  })

  it('builds the fiat currencies url', async () => {
    mockFetchJson.mockResolvedValue({ currencies: [] })
    await meldApiClient().getFiatCurrencies({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US'
    })
    expectGet(
      '/proxy/meld/network-partner/supported/currencies?type=FIAT&category=CRYPTO_ONRAMP&country=US'
    )
  })

  it('builds the countries url', async () => {
    mockFetchJson.mockResolvedValue({ countries: [] })
    await meldApiClient().getCountries({
      category: ServiceProviderCategories.CRYPTO_ONRAMP
    })
    expectGet(
      '/proxy/meld/network-partner/supported/countries?category=CRYPTO_ONRAMP'
    )
  })

  it('builds the payment methods url', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient().getPaymentMethods({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      currencyCode: 'USD'
    })
    expectGet(
      '/proxy/meld/network-partner/supported/payment-methods?category=CRYPTO_ONRAMP&country=US&currencyCode=USD'
    )
  })

  it('appends the subdivision to the routes url', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient().getRoutes({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      sourceCurrencyCode: 'USD',
      destinationCurrencyCode: 'AVAXC',
      subdivision: 'US-CA'
    })
    expectGet(
      '/proxy/meld/network-partner/supported/routes/CRYPTO_ONRAMP/US/USD/AVAXC?subdivision=US-CA'
    )
  })

  it('uses the sandbox proxy base for the sandbox client', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient(true).getPartners({
      category: ServiceProviderCategories.CRYPTO_ONRAMP
    })
    expectGet(
      '/proxy/meld-sandbox/network-partner/partners?status=LIVE&category=CRYPTO_ONRAMP'
    )
  })

  it('posts the JSON body with the content-type header', async () => {
    mockFetchJson.mockResolvedValue({})
    const body = { sourceAmount: 10 } as unknown as CreateCryptoQuoteParams
    await meldApiClient().createCryptoQuotes(body)
    const [url, options, schema] = mockFetchJson.mock.calls[0]
    expect(url.slice(-'/proxy/meld/payments/crypto/quote'.length)).toBe(
      '/proxy/meld/payments/crypto/quote'
    )
    expect(options).toEqual({
      method: 'POST',
      headers: { ...versionHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    expect(schema).toBeTruthy()
  })

  it('sends Meld-Version 2026-02-03 on GET and POST requests', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient().getPartners({
      category: ServiceProviderCategories.CRYPTO_ONRAMP
    })
    mockFetchJson.mockResolvedValue({})
    await meldApiClient().createCryptoQuotes({} as CreateCryptoQuoteParams)
    const [, getOptions] = mockFetchJson.mock.calls[0]
    const [, postOptions] = mockFetchJson.mock.calls[1]
    expect(getOptions.headers).toMatchObject({ 'Meld-Version': '2026-02-03' })
    expect(postOptions.headers).toMatchObject({ 'Meld-Version': '2026-02-03' })
  })

  it('sends the version header on the transaction lookup', async () => {
    mockFetchJson.mockResolvedValue({})
    await meldApiClient().fetchTransactionBySessionId('abc')
    const [url, options] = mockFetchJson.mock.calls[0]
    expect(url.endsWith('/proxy/meld/payments/transactions/sessions/abc')).toBe(
      true
    )
    expect(options.headers).toMatchObject({ 'Meld-Version': '2026-02-03' })
  })

  it('rejects an unwrapped currencies body', async () => {
    mockFetchJson.mockResolvedValue([])
    await expect(
      meldApiClient().getCryptoCurrencies({
        category: ServiceProviderCategories.CRYPTO_ONRAMP
      })
    ).rejects.toThrow('unexpected response shape')
  })
})
