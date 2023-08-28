import { z } from 'zod'

const transactionSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.string().optional(),
  data: z.string().optional(),
  gas: z.string().or(z.number()).optional(),
  gasPrice: z.string().optional()
})

const paramsSchema = z.tuple([transactionSchema])

const approveDataSchema = z.object({
  txParams: transactionSchema
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}

export type TransactionParams = {
  from: string
  to: string
  value?: string
  data?: string
  gas?: string | number
  gasPrice?: string
}
