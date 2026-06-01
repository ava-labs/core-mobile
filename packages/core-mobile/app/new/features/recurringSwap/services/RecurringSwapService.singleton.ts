import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { RecurringSwapService } from './RecurringSwapService'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing. RecurringSwapService disabled.')

if (!Config.MARKR_API_KEY)
  Logger.warn('MARKR_API_KEY is missing. RecurringSwapService disabled.')

let _instance: RecurringSwapService | null = null

export function getRecurringSwapService(): RecurringSwapService {
  if (_instance === null) {
    _instance = new RecurringSwapService({
      baseUrl: `${Config.PROXY_URL ?? ''}/proxy/markr`,
      bearerToken: Config.MARKR_API_KEY ?? ''
    })
  }
  return _instance
}
