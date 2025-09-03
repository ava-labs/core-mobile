import http from 'http'
import Blockaid from '@blockaid/client'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { SiteScanResponse } from './types'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Blockaid service disabled.')

const baseURL = Config.PROXY_URL + '/proxy/blockaid/'

const blockaid = new Blockaid({
  baseURL,
  apiKey: 'DUMMY_API_KEY', // since we're using our own proxy and api key is handled there, we can use a dummy key here
  fetch: global.fetch,
  httpAgent: new http.Agent()
})

class BlockaidService {
  static scanSite = async (url: string): Promise<SiteScanResponse> =>
    blockaid.site.scan({ url })
}

export default BlockaidService
