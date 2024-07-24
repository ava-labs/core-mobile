import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { z } from 'zod'
import Logger from 'utils/Logger'
import { DeFiProtocolInformationSchema } from './debankTypes'

if (!Config.PROXY_URL) Logger.warn('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/proxy/debank/v1'

export const browserApiClient = new Zodios(
  baseUrl,
  [
    {
      method: 'get',
      path: '/protocol/list',
      parameters: [{ name: 'chain_id', type: 'Query', schema: z.string() }],
      alias: 'getDeFiProtocolInformationList',
      response: z.array(DeFiProtocolInformationSchema)
    }
  ],
  {
    axiosConfig: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
)
