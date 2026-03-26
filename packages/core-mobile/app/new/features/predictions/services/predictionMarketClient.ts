import Config from 'react-native-config'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { createPredictionMarketApi } from '@avalabs/prediction-market-sdk'
import Logger from 'utils/Logger'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing. Predictions service disabled.')

/**
 * Singleton SDK client.
 * baseUrl routes SDK calls through the Core backend proxy which adds
 * the required Kalshi RSA-PSS auth headers.
 */
export const predictionMarketClient = createPredictionMarketApi({
  baseUrl: `${Config.PROXY_URL}/proxy/kalshi`,
  fetch: nitroFetch as unknown as typeof fetch
})
