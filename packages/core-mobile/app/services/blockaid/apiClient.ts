import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { array, string, object, literal, union, boolean } from 'zod'
import { TransactionValidationSimulationSchema } from './types'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/proxy/blockaid/'

const BlockaidTransactionSchema = object({
  options: array(union([literal('simulation'), literal('validation')])),
  metadata: object({
    domain: string().optional(),
    non_dapp: boolean().optional()
  }),
  data: object({
    from: string(),
    to: string().optional(),
    data: string().optional(),
    value: string().optional(),
    gas: string().optional(),
    gas_price: string().optional()
  })
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createBlockaidAPIClient(network: string) {
  return new Zodios(baseUrl, [
    {
      method: 'post',
      path: `/${network}/v0/validate/transaction`,
      requestFormat: 'json',
      parameters: [
        { name: 'body', type: 'Body', schema: BlockaidTransactionSchema }
      ],
      alias: 'validateTransaction',
      response: TransactionValidationSimulationSchema
    }
  ])
}
