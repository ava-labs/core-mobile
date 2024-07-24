import DeFiService from './DeFiService'
import {
  exchangeRateApiClient,
  exchangeRateFallbackApiClient
} from './apiClient'

const mockExchangeRate = { date: '2024-04-23', usd: { usd: 1.0, eur: 0.85 } }

describe('DeFiService', () => {
  describe('getExchangeRates', () => {
    it('returns exchange rates from the primary API', async () => {
      jest
        .spyOn(exchangeRateApiClient, 'getExchangeRates')
        .mockResolvedValue(mockExchangeRate)
      const result = await DeFiService.getExchangeRates()
      expect(result).toEqual(mockExchangeRate)
    })

    it('returns exchange rates from the fallback API when the primary API fails', async () => {
      jest
        .spyOn(exchangeRateApiClient, 'getExchangeRates')
        .mockRejectedValue(new Error('API error'))
      jest
        .spyOn(exchangeRateFallbackApiClient, 'getExchangeRates')
        .mockResolvedValue(mockExchangeRate)

      const result = await DeFiService.getExchangeRates()
      expect(result).toEqual(mockExchangeRate)
    })
  })
})
