import z from 'zod'

export const JUPITER_QUOTE_SCHEMA = z.object({
  inputMint: z.string(),
  inAmount: z.string(),
  outputMint: z.string(),
  outAmount: z.string(),
  otherAmountThreshold: z.string(),
  swapMode: z.string(),
  slippageBps: z.number(),
  platformFee: z
    .object({
      amount: z.string(),
      feeBps: z.number()
    })
    .nullable(),
  priceImpactPct: z.string(),
  routePlan: z.array(z.any()),
  contextSlot: z.number(),
  timeTaken: z.number()
})

export const JUPITER_TX_SCHEMA = z.object({
  swapTransaction: z.string().base64(),
  simulationError: z.any().nullable() // This is not documented, so we're not validating its contents. We only care if it's present at the moment.
})

export type JupiterQuote = z.infer<typeof JUPITER_QUOTE_SCHEMA>
export type JupiterTx = z.infer<typeof JUPITER_TX_SCHEMA>
