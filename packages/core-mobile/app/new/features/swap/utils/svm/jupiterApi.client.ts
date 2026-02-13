import { z } from 'zod'
import {
  fetchJson,
  buildQueryString
} from 'utils/api/common/fetchWithValidation'
import {
  JUPITER_QUOTE_SCHEMA,
  JUPITER_TX_SCHEMA,
  JupiterQuote,
  JupiterTx
} from './schemas'

const JUPITER_BASE_URL = 'https://lite-api.jup.ag/swap/v1'

// Swap request body schema
const SwapBodySchema = z.object({
  quoteResponse: JUPITER_QUOTE_SCHEMA,
  userPublicKey: z.string(),
  dynamicComputeUnitLimit: z.boolean(),
  feeAccount: z.string().optional()
})

type SwapBody = z.infer<typeof SwapBodySchema>

export const jupiterApi = {
  // GET /quote
  getQuote: async ({
    inputMint,
    outputMint,
    swapMode,
    amount,
    slippageBps,
    platformFeeBps,
    signal
  }: {
    inputMint: string
    outputMint: string
    swapMode: string
    amount: string
    slippageBps: string
    platformFeeBps?: string
    signal?: AbortSignal
  }): Promise<JupiterQuote> => {
    const queryString = buildQueryString({
      inputMint,
      outputMint,
      swapMode,
      amount,
      slippageBps,
      platformFeeBps
    })
    return fetchJson(
      `${JUPITER_BASE_URL}/quote${queryString}`,
      { method: 'GET', signal },
      JUPITER_QUOTE_SCHEMA
    )
  },

  // POST /swap
  swap: async (body: SwapBody): Promise<JupiterTx> => {
    return fetchJson(
      `${JUPITER_BASE_URL}/swap`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      },
      JUPITER_TX_SCHEMA
    )
  }
}
