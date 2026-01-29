import { makeApi, Zodios } from '@zodios/core'
import { z } from 'zod'
import { JUPITER_QUOTE_SCHEMA, JUPITER_TX_SCHEMA } from './schemas'

const endpoints = makeApi([
  {
    method: 'get',
    path: '/quote',
    alias: 'getQuote',
    parameters: [
      { name: 'inputMint', type: 'Query', schema: z.string() },
      { name: 'outputMint', type: 'Query', schema: z.string() },
      { name: 'swapMode', type: 'Query', schema: z.string() },
      { name: 'amount', type: 'Query', schema: z.string() },
      { name: 'slippageBps', type: 'Query', schema: z.string() },
      { name: 'platformFeeBps', type: 'Query', schema: z.string().optional() }
    ],
    response: JUPITER_QUOTE_SCHEMA
  },
  {
    method: 'post',
    path: '/swap',
    alias: 'swap',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          quoteResponse: JUPITER_QUOTE_SCHEMA,
          userPublicKey: z.string(),
          dynamicComputeUnitLimit: z.boolean(),
          feeAccount: z.string().optional()
        })
      }
    ],
    response: JUPITER_TX_SCHEMA
  }
])

const JUPITER_BASE_URL = 'https://lite-api.jup.ag/swap/v1'

export const jupiterApi = new Zodios(JUPITER_BASE_URL, endpoints)
