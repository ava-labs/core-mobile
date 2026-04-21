import { createPredictionMarketApi } from '@avalabs/prediction-market-sdk'
import Config from 'react-native-config'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import Logger from 'utils/Logger'

if (!Config.PROXY_URL) {
  Logger.warn('PROXY_URL is missing. Predictions service disabled.')
  if (__DEV__) {
    throw new Error(
      'PROXY_URL is missing. Run `yarn envs` to fetch environment variables.'
    )
  }
}

export const predictionMarketClient = createPredictionMarketApi({
  baseUrl: `${Config.PROXY_URL}/proxy/hashflow`,
  fetch: nitroFetch as unknown as typeof fetch
})
