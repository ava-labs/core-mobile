import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { z } from 'zod'
import {
  DeFiChainSchema,
  DeFiProtocolSchema,
  DeFiSimpleProtocolSchema
} from './debankTypes'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/proxy/debank/v1'

export const apiClient = new Zodios(
  baseUrl,
  [
    {
      method: 'get',
      path: '/chain/list',
      alias: 'getSupportedChainList',
      response: z.array(DeFiChainSchema)
    },
    {
      method: 'get',
      path: 'user/protocol',
      parameters: [
        { name: 'id', type: 'Query', schema: z.string() },
        { name: 'protocol_id', type: 'Query', schema: z.string() }
      ],
      alias: 'getDeFiProtocol',
      response: DeFiProtocolSchema
    },
    {
      method: 'get',
      path: 'user/all_simple_protocol_list',
      parameters: [{ name: 'id', type: 'Query', schema: z.string() }],
      alias: 'getDeFiProtocolList',
      response: z.array(DeFiSimpleProtocolSchema)
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
