import Config from 'react-native-config'
import { z } from 'zod'
import Logger from 'utils/Logger'
import {
  fetchJson,
  buildQueryString
} from 'utils/api/common/fetchWithValidation'
import { DeFiProtocolInformationSchema } from './debankTypes'

if (!Config.PROXY_URL) Logger.warn('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/proxy/debank/v1'

// Infer TypeScript types from Zod schemas
type DeFiProtocolInformation = z.infer<typeof DeFiProtocolInformationSchema>

export const browserApiClient = {
  // GET /protocol/list
  getDeFiProtocolInformationList: async (
    chain_id: string
  ): Promise<DeFiProtocolInformation[]> => {
    const queryString = buildQueryString({ chain_id })
    return fetchJson(
      `${baseUrl}/protocol/list${queryString}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      z.array(DeFiProtocolInformationSchema)
    )
  }
}
