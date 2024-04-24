import { SafeParseReturnType, z } from 'zod'

const paramsSchema = z.tuple([z.string(), z.string(), z.number()]) // [address, amount, feeRate]

export const parseRequestParams = (
  params: unknown
): SafeParseReturnType<unknown, TransactionParams> => {
  return paramsSchema.safeParse(params)
}

export type TransactionParams = [string, string, number]
