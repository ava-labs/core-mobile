import { z } from 'zod'
import { RpcMethod } from 'store/walletConnectV2/types'
import { addressSchema, messageSchema } from './shared'

// https://github.com/ethereum/go-ethereum/pull/2940
export const personalSignSchema = z.object({
  method: z.literal(RpcMethod.PERSONAL_SIGN),
  params: z.union([
    z.tuple([messageSchema, addressSchema]),
    z.tuple([
      messageSchema,
      addressSchema,
      z.string().optional().describe('password')
    ])
  ])
})
