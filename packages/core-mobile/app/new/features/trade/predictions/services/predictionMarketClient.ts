import { createPredictionMarketApi } from '@avalabs/prediction-market-sdk'
import Config from 'react-native-config'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import Logger from 'utils/Logger'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing. Predictions service disabled.')

/**
 * Singleton SDK client.
 * baseUrl routes SDK calls through the Core backend proxy which adds
 * the required Hashflow auth headers.
 */
export const predictionMarketClient = createPredictionMarketApi({
  baseUrl: `${Config.PROXY_URL}/proxy/hashflow`,
  fetch: nitroFetch as unknown as typeof fetch
})
