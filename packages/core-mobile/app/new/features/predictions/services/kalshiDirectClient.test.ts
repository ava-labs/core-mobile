jest.mock('utils/api/common/fetchWithValidation', () => ({
  fetchJson: jest.fn(),
  buildQueryString: jest.requireActual(
    'utils/api/common/fetchWithValidation'
  ).buildQueryString
}))

import { fetchJson } from 'utils/api/common/fetchWithValidation'
import { kalshiDirectClient } from './kalshiDirectClient'

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>

afterEach(() => {
  mockFetchJson.mockReset()
})

describe('getHistoricalCutoff', () => {
  it('returns cutoff data on success', async () => {
    const mockCutoff = { cutoff_price: '0.5000', cutoff_timestamp: 1700000000 }
    mockFetchJson.mockResolvedValueOnce(mockCutoff)
    const result = await kalshiDirectClient.getHistoricalCutoff()
    expect(result).toEqual(mockCutoff)
    expect(mockFetchJson).toHaveBeenCalledWith(
      'https://api.elections.kalshi.com/trade-api/v2/historical/cutoff'
    )
  })

  it('throws on HTTP error', async () => {
    mockFetchJson.mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
    await expect(kalshiDirectClient.getHistoricalCutoff()).rejects.toThrow(
      'HTTP 500'
    )
  })

  it('preserves *_dollars decimal string format', async () => {
    // Kalshi fixed-point: *_dollars are string decimals, not floats — preserve as-is
    mockFetchJson.mockResolvedValueOnce({
      cutoff_price: '0.7100',
      cutoff_timestamp: 1700000000
    })
    const result = await kalshiDirectClient.getHistoricalCutoff()
    expect(typeof result.cutoff_price).toBe('string')
    expect(result.cutoff_price).toBe('0.7100')
  })
})

describe('getCandlesticks', () => {
  it('returns candlestick data and passes correct query params', async () => {
    const mockCandles = {
      candlesticks: [
        {
          ticker: 'INXD-24',
          period_interval: 60,
          ts: 1700000000,
          yes_ask: {
            close: '0.7100',
            open: '0.6900',
            high: '0.7200',
            low: '0.6800'
          },
          yes_bid: {
            close: '0.6900',
            open: '0.6700',
            high: '0.7000',
            low: '0.6600'
          },
          price: {
            close: '0.7000',
            open: '0.6800',
            high: '0.7100',
            low: '0.6700'
          },
          volume: '100.00'
        }
      ]
    }
    mockFetchJson.mockResolvedValueOnce(mockCandles)
    const result = await kalshiDirectClient.getCandlesticks({
      ticker: 'INXD-24',
      periodInterval: 60,
      startTs: 1699990000
    })
    expect(result.candlesticks).toHaveLength(1)
    expect(result.candlesticks[0]?.ticker).toBe('INXD-24')
    // Verify correct URL construction with query params
    const calledUrl = mockFetchJson.mock.calls[0]?.[0]
    expect(calledUrl).toContain('/historical/candlesticks/INXD-24')
    expect(calledUrl).toContain('period_interval=60')
    expect(calledUrl).toContain('start_ts=1699990000')
  })
})

describe('registerKyc (proxy)', () => {
  it('returns access token on success', async () => {
    mockFetchJson.mockResolvedValueOnce({ accessToken: 'tok_abc123' })
    const result = await kalshiDirectClient.registerKyc()
    expect(result.accessToken).toBe('tok_abc123')
    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.stringContaining('/kyc/register'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('getKycStatus (proxy)', () => {
  it('returns approved status', async () => {
    mockFetchJson.mockResolvedValueOnce({ status: 'approved' })
    const result = await kalshiDirectClient.getKycStatus()
    expect(result.status).toBe('approved')
    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.stringContaining('/kyc/status')
    )
  })
})
