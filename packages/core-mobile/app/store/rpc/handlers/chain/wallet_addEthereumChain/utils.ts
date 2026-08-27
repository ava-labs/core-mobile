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
  // Shape only. URL policy (valid URL, HTTPS, no localhost/private hosts) is
  // enforced by validateCustomRpcUrl in the handler, which runs only for chains
  // being ADDED — an already-known chainId keeps its trusted config and must not
  // be rejected over the URL the dApp happened to send.
  rpcUrls: z.array(z.string()).optional(),
  isTestnet: z.boolean().optional()
})

const paramsSchema = z.tuple([chainInfoSchema]).rest(z.unknown())

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
