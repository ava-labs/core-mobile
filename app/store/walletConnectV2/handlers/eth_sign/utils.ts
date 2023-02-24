import { z } from 'zod'
import { RpcMethod } from 'store/walletConnectV2'
import { SessionTypes } from '@walletconnect/types'
import { networkSchema } from '../chain/utils'
import { accountSchema } from '../account/avalanche_selectAccount/utils'
import { EthSignRpcRequest } from './eth_sign'

const personalSignSchema = z.object({
  method: z.literal(RpcMethod.PERSONAL_SIGN),
  params: z.union([
    z.tuple([z.string(), z.string()]),
    z.tuple([z.string(), z.string(), z.string().optional()])
  ])
})

const ethSignSchema = z.object({
  method: z.literal(RpcMethod.ETH_SIGN),
  params: z.tuple([z.string(), z.string()])
})

// https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc
export const typedDataSchema = z.object({
  types: z
    .object({ EIP712Domain: z.array(z.any()) })
    .catchall(z.array(z.object({ name: z.string(), type: z.string() }))),
  primaryType: z.string(),
  domain: z.record(z.any()),
  message: z.record(z.any())
})

export const oldTypedDataSchema = z
  .array(
    z.object({
      type: z.string(),
      name: z.string(),
      value: z.any()
    })
  )
  .nonempty()

export type TypedData = z.infer<typeof typedDataSchema>
export type OldTypedData = z.infer<typeof oldTypedDataSchema>

const ethSignTypedDataSchema = z.object({
  method: z.literal(RpcMethod.SIGN_TYPED_DATA),
  params: z.tuple([oldTypedDataSchema, z.string()])
})

const ethSignTypedDataV1Schema = z.object({
  method: z.literal(RpcMethod.SIGN_TYPED_DATA_V1),
  params: z.tuple([oldTypedDataSchema, z.string()])
})

const ethSignTypedDataV3Schema = z.object({
  method: z.literal(RpcMethod.SIGN_TYPED_DATA_V3),
  params: z.tuple([z.string(), z.string()])
})

const ethSignTypedDataV4Schema = z.object({
  method: z.literal(RpcMethod.SIGN_TYPED_DATA_V4),
  params: z.tuple([z.string(), z.string()])
})

const paramsSchema = z
  .discriminatedUnion('method', [
    personalSignSchema,
    ethSignSchema,
    ethSignTypedDataSchema,
    ethSignTypedDataV1Schema,
    ethSignTypedDataV3Schema,
    ethSignTypedDataV4Schema
  ])
  .transform((value, ctx) => {
    const { method, params } = value

    switch (method) {
      case RpcMethod.PERSONAL_SIGN:
        return {
          data: params[0],
          address: params[1]
        }
      case RpcMethod.ETH_SIGN:
        return {
          data: params[1],
          address: params[0]
        }
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
        return {
          data: params[0],
          address: params[1]
        }
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        let parsed, result

        try {
          parsed = JSON.parse(params[1])
          result = typedDataSchema.parse(parsed)
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'param is not a valid json'
          })

          return z.NEVER
        }
        return {
          data: result,
          address: params[0]
        }
      }
    }
  })

const approveDataSchema = z.object({
  data: z.union([z.string(), oldTypedDataSchema, typedDataSchema]),
  network: networkSchema,
  account: accountSchema
})

export function parseRequestParams(request: EthSignRpcRequest) {
  return paramsSchema.safeParse(request.data.params.request)
}

export function parseApproveData(data: unknown) {
  return approveDataSchema.safeParse(data)
}

export const isAddressApproved = (
  address: string,
  namespaces: SessionTypes.Namespaces
) => {
  return namespaces.eip155?.accounts.some(
    account => account.toLowerCase() === address.toLowerCase()
  )
}
