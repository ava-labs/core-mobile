import { SafeParseReturnType, z } from 'zod'

const paramsSchema = z.tuple([
  z.string().describe('bitcoin receiving address'),
  z.string().describe('send amount'),
  z.number().describe('fee rate')
])

export const parseRequestParams = (
  params: unknown
): SafeParseReturnType<unknown, TransactionParams> => {
  return paramsSchema.safeParse(params)
}

export type TransactionParams = [string, string, number]
