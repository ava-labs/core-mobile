import { z } from 'zod'

export const accountSchema = z.object({
  index: z.number(),
  title: z.string(),
  addressBtc: z.string(),
  address: z.string(),
  addressAVM: z.string().optional(),
  addressPVM: z.string().optional(),
  addressCoreEth: z.string().optional()
})

const paramsSchema = z.tuple([z.number().nonnegative()])

const approveDataSchema = z.object({
  account: accountSchema
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
