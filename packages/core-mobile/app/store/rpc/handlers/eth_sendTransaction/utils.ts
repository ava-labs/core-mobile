import { SafeParseReturnType, z } from 'zod'

const transactionSchema = z.object({
  from: z.string().length(42),
  to: z.string().length(42),
  data: z.string().optional(),
  value: z.string().startsWith('0x').optional(),
  gas: z.string().startsWith('0x').optional(),
  gasPrice: z.string().startsWith('0x').optional(),
  maxFeePerGas: z.string().startsWith('0x').optional(),
  maxPriorityFeePerGas: z.string().startsWith('0x').optional(),
  nonce: z.string().startsWith('0x').optional()
})

const paramsSchema = z.tuple([transactionSchema])

const approveDataSchema = z.object({
  txParams: transactionSchema
})

export const parseRequestParams = (
  params: unknown
): SafeParseReturnType<unknown, TransactionParams[]> => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (
  data: unknown
): SafeParseReturnType<
  unknown,
  {
    txParams: TransactionParams
  }
> => {
  return approveDataSchema.safeParse(data)
}

export type TransactionParams = {
  from: string
  to: string
  data?: string
  value?: string
  gas?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: string
}
