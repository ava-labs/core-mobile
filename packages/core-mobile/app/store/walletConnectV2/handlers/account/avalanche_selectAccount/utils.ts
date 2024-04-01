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

const paramsSchema = z.tuple([
  z.union([z.string(), z.number()]).pipe(z.coerce.number().nonnegative())
])

const approveDataSchema = z.object({
  account: accountSchema
})

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[number], [number]> => {
  return paramsSchema.safeParse(params)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
