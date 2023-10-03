import Config from 'react-native-config'
import { initClient, initContract } from '@ts-rest/core'
import { z } from 'zod'
import {
  DeFiChainSchema,
  DeFiProtocolSchema,
  DeFiSimpleProtocolSchema
} from './debankTypes'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const c = initContract()

const contract = c.router(
  {
    getSupportedChainList: {
      method: 'GET',
      path: 'chain/list',
      responses: {
        200: DeFiChainSchema.array()
      }
    },
    getDeFiProtocol: {
      method: 'GET',
      path: 'user/protocol',
      query: z.object({
        id: z.string(),
        protocol_id: z.string()
      }),
      responses: {
        200: DeFiProtocolSchema
      }
    },
    getDeFiProtocolList: {
      method: 'GET',
      path: 'user/all_simple_protocol_list',
      query: z.object({
        id: z.string()
      }),
      responses: {
        200: DeFiSimpleProtocolSchema.array()
      }
    }
  },
  {
    pathPrefix: '/proxy/debank/v1/'
  }
)

export const defiClient = initClient(contract, {
  baseUrl: Config.PROXY_URL,
  baseHeaders: {
    'Content-Type': 'application/json'
  }
})
