import { z } from 'zod'

const paramsSchema = z.object({
  transactionHex: z.string(),
  chainAlias: z.enum(['X', 'P', 'C']),
  externalIndices: z.number().array().optional(),
  internalIndices: z.number().array().optional()
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}
