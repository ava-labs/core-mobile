import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { RecurringSchedulesService } from './RecurringSchedulesService'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing. RecurringSchedulesService disabled.')

if (!Config.MARKR_API_KEY)
  Logger.warn('MARKR_API_KEY is missing. RecurringSchedulesService disabled.')

let _instance: RecurringSchedulesService | null = null

export function getRecurringSchedulesService(): RecurringSchedulesService {
  if (_instance === null) {
    _instance = new RecurringSchedulesService({
      baseUrl: `${Config.PROXY_URL ?? ''}/proxy/markr`,
      bearerToken: Config.MARKR_API_KEY ?? ''
    })
  }
  return _instance
}
