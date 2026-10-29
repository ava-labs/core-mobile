import Logger from 'utils/Logger'
import { fetchJson } from 'utils/api/common/fetchWithValidation'
import { ServiceProviderCategories } from '../consts'
import { npRoutesUsdAvaxc } from './__fixtures__/networkPartner'
import { meldApiClient } from './apiClient'

jest.mock('utils/api/common/fetchWithValidation', () => ({
  ...jest.requireActual('utils/api/common/fetchWithValidation'),
  fetchJson: jest.fn()
}))

const mockFetchJson = fetchJson as jest.Mock

const httpError = (status: number): Error & { response: { status: number } } =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('meldApiClient network-partner', () => {
  beforeEach(() => {
    mockFetchJson.mockReset()
    jest.spyOn(Logger, 'warn').mockImplementation(() => undefined)
  })

  it('resolves defaults to [] when the category is not live (404)', async () => {
    mockFetchJson.mockRejectedValue(httpError(404))
    await expect(
      meldApiClient().getDefaultsByCountryNp({
        category: ServiceProviderCategories.CRYPTO_OFFRAMP,
        country: 'US'
      })
    ).resolves.toEqual([])
    expect(Logger.warn).toHaveBeenCalledTimes(1)
  })

  it('rethrows other defaults errors', async () => {
    mockFetchJson.mockRejectedValue(httpError(500))
    await expect(
      meldApiClient().getDefaultsByCountryNp({
        category: ServiceProviderCategories.CRYPTO_OFFRAMP,
        country: 'US'
      })
    ).rejects.toThrow('HTTP 500')
  })

  it('builds the routes path from category, country and currencies', async () => {
    mockFetchJson.mockResolvedValue(npRoutesUsdAvaxc)
    await meldApiClient().getRoutes({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      sourceCurrencyCode: 'USD',
      destinationCurrencyCode: 'AVAXC'
    })
    expect(mockFetchJson.mock.calls[0][0]).toMatch(
      /\/network-partner\/supported\/routes\/CRYPTO_ONRAMP\/US\/USD\/AVAXC$/
    )
  })

  it('builds the currencies url in buildQueryString order', async () => {
    mockFetchJson.mockResolvedValue({ currencies: [] })
    await meldApiClient().getCryptoCurrenciesNp({
      category: ServiceProviderCategories.CRYPTO_ONRAMP,
      country: 'US',
      partner: 'STRIPE'
    })
    expect(mockFetchJson.mock.calls[0][0]).toMatch(
      /\/proxy\/meld\/network-partner\/supported\/currencies\?type=CRYPTO&category=CRYPTO_ONRAMP&country=US&partner=STRIPE$/
    )
  })

  it('defaults partners to LIVE status', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient().getPartners({
      category: ServiceProviderCategories.CRYPTO_ONRAMP
    })
    expect(mockFetchJson.mock.calls[0][0]).toContain('status=LIVE')
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
    expect(mockFetchJson.mock.calls[0][0]).toContain('?subdivision=US-CA')
  })

  it('uses the sandbox proxy base for the sandbox client', async () => {
    mockFetchJson.mockResolvedValue([])
    await meldApiClient(true).getPartners({
      category: ServiceProviderCategories.CRYPTO_ONRAMP
    })
    expect(mockFetchJson.mock.calls[0][0]).toContain('/proxy/meld-sandbox/')
  })

  it('rejects an unwrapped currencies body', async () => {
    mockFetchJson.mockResolvedValue([])
    await expect(
      meldApiClient().getCryptoCurrenciesNp({
        category: ServiceProviderCategories.CRYPTO_ONRAMP
      })
    ).rejects.toThrow('unexpected response shape')
  })
})
