import Config from 'react-native-config'
import {
  fetchJson,
  buildQueryString
} from 'utils/api/common/fetchWithValidation'

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2'
const KYC_PROXY_BASE = `${Config.PROXY_URL}/proxy/kalshi`

// --- Historical data types (unauthenticated, direct) ---

export type HistoricalCutoff = {
  /** Decimal string, e.g. "0.5000" */
  cutoff_price: string
  cutoff_timestamp: number
}

export type CandlestickEntry = {
  ticker: string
  period_interval: number
  ts: number
  yes_ask: { close: string; open: string; high: string; low: string }
  yes_bid: { close: string; open: string; high: string; low: string }
  price: { close: string; open: string; high: string; low: string }
  /** Fixed-point string, e.g. "100.00" */
  volume: string
}

export type CandlesticksResponse = {
  candlesticks: CandlestickEntry[]
}

export type GetCandlesticksParams = {
  ticker: string
  /**
   * 1 = 1 minute (1H chart)
   * 60 = 1 hour (1D chart)
   * 1440 = 1 day (1W / 1M / ALL charts)
   */
  periodInterval: 1 | 60 | 1440
  startTs: number
  endTs?: number
}

// --- KYC types (via proxy) ---

export type KycRegisterResponse = {
  /** Sumsub access token */
  accessToken: string
}

export type KycStatusResponse = {
  status: 'idle' | 'pending' | 'approved' | 'rejected'
  /** Present when status is 'rejected' */
  rejectionReason?: string
}

// --- Client ---

export const kalshiDirectClient = {
  /**
   * Always call before getCandlesticks — determines how far back data goes.
   * Unauthenticated, called directly (not proxied).
   */
  getHistoricalCutoff: (): Promise<HistoricalCutoff> =>
    fetchJson<HistoricalCutoff>(`${KALSHI_BASE}/historical/cutoff`),

  /**
   * OHLC candlestick data for the probability chart.
   * Prices exclude fees — the UI must show the disclaimer.
   * Unauthenticated, called directly (not proxied).
   */
  getCandlesticks: ({
    ticker,
    periodInterval,
    startTs,
    endTs
  }: GetCandlesticksParams): Promise<CandlesticksResponse> => {
    const query = buildQueryString({
      period_interval: periodInterval,
      start_ts: startTs,
      ...(endTs !== undefined && { end_ts: endTs })
    })
    return fetchJson<CandlesticksResponse>(
      `${KALSHI_BASE}/historical/candlesticks/${ticker}${query}`
    )
  },

  /**
   * Register user for KYC — returns a Sumsub access token.
   * Routes through Core backend proxy (RSA-PSS auth added server-side).
   * ⚠️ Path unconfirmed — update once Hashflow confirms the endpoint.
   */
  registerKyc: (): Promise<KycRegisterResponse> =>
    fetchJson<KycRegisterResponse>(`${KYC_PROXY_BASE}/kyc/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),

  /**
   * Get KYC approval status for the current user.
   * Routes through Core backend proxy.
   * ⚠️ Path unconfirmed — update once Hashflow confirms the endpoint.
   */
  getKycStatus: (): Promise<KycStatusResponse> =>
    fetchJson<KycStatusResponse>(`${KYC_PROXY_BASE}/kyc/status`)
}
