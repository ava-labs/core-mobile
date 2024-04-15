import { z } from 'zod'
import { RpcMethod } from 'store/rpc/types'
import { addressSchema, messageSchema } from './shared'

// https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
export const ethSignSchema = z.object({
  method: z.literal(RpcMethod.ETH_SIGN),
  params: z.tuple([addressSchema, messageSchema])
})
