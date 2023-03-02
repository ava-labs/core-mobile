import { z } from 'zod'
import { RpcMethod } from 'store/walletConnectV2/types'
import { SessionTypes } from '@walletconnect/types'
import { accountSchema } from '../account/avalanche_selectAccount/utils'
import { networkSchema } from '../chain/utils'
import { ethSignSchema } from './schemas/ethSign'
import {
  combinedDataSchema,
  combinedTypedDataSchema,
  ethSignTypedDataSchema,
  ethSignTypedDataV1Schema,
  ethSignTypedDataV3Schema,
  ethSignTypedDataV4Schema,
  typedDataSchema
} from './schemas/ethSignTypedData'
import { personalSignSchema } from './schemas/personalSign'

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
      case RpcMethod.SIGN_TYPED_DATA_V1: {
        const address = params[0]
        const data = params[1]

        if (typeof data !== 'string') return { data, address }

        try {
          const parsed = JSON.parse(data)
          const result = combinedTypedDataSchema.parse(parsed)

          return {
            data: result,
            address
          }
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'param is not a valid json'
          })

          return z.NEVER
        }
      }
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        const address = params[0]
        const data = params[1]

        if (typeof data !== 'string') return { data, address }

        try {
          const parsed = JSON.parse(data)
          const result = typedDataSchema.parse(parsed)

          return {
            data: result,
            address
          }
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'param is not a valid json'
          })

          return z.NEVER
        }
      }
    }
  })

const approveDataSchema = z.object({
  data: combinedDataSchema,
  network: networkSchema,
  account: accountSchema
})

export function parseRequestParams(params: {
  method: string
  params: unknown
}) {
  return paramsSchema.safeParse(params)
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
