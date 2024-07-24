import { SafeParseReturnType, z } from 'zod'

const paramsSchema = z.object({
  transactionHex: z.string(),
  chainAlias: z.enum(['X', 'P', 'C']),
  externalIndices: z.number().array().optional(),
  internalIndices: z.number().array().optional(),
  utxos: z.string().array().optional()
})

export const parseRequestParams = (
  params: unknown
): SafeParseReturnType<unknown, TransactionParams> => {
  return paramsSchema.safeParse(params)
}

export type TransactionParams = {
  externalIndices?: number[] | undefined
  internalIndices?: number[] | undefined
  utxos?: string[] | undefined
  transactionHex: string
  chainAlias: 'X' | 'P' | 'C'
}
