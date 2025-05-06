import { z } from 'zod'
import { networkSchema } from '../utils'

const chainInfoSchema = z.object({
  chainId: z.string(),
  blockExplorerUrls: z.array(z.string()).optional(),
  chainName: z.string().optional(),
  iconUrls: z.array(z.string()).optional(),
  nativeCurrency: z
    .object({
      name: z.string(),
      symbol: z.string(),
      decimals: z.number()
    })
    .optional(),
  rpcUrls: z.array(z.string()).optional(),
  isTestnet: z.boolean().optional()
})

const paramsSchema = z.tuple([chainInfoSchema])

const approveDataSchema = z.object({
  network: networkSchema
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
