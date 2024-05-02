import BN from 'bn.js'
import { SafeParseReturnType, z } from 'zod'

const dAppParamsSchema = z.tuple([
  z.string().describe('bitcoin receiving address'),
  z.string().describe('send amount'),
  z.number().describe('fee rate')
])

const inAppParamsSchema = z.object({
  address: z.string(),
  amount: z.instanceof(BN),
  defaultMaxFeePerGas: z.bigint(),
  canSubmit: z.literal(true),
  maxAmount: z.instanceof(BN),
  sendFee: z.instanceof(BN),
  gasLimit: z.number()
})

const paramsSchema = dAppParamsSchema.or(inAppParamsSchema)

export const parseRequestParams = (
  params: unknown
): SafeParseReturnType<
  unknown,
  DAppTransactionParams | InAppTransactionParams
> => {
  return paramsSchema.safeParse(params)
}

type DAppTransactionParams = [string, string, number]

export type InAppTransactionParams = {
  amount: BN
  address: string
  defaultMaxFeePerGas: bigint
  canSubmit: true
  maxAmount: BN
  sendFee: BN
  gasLimit: number
}

export const isDAppTransactionParams = (
  params: DAppTransactionParams | InAppTransactionParams
): params is DAppTransactionParams => {
  if (Array.isArray(params)) {
    return (
      typeof params[0] === 'string' &&
      typeof params[1] === 'string' &&
      typeof params[2] === 'number'
    )
  }

  return false
}
