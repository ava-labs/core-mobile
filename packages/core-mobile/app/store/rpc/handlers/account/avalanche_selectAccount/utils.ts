import { z } from 'zod'
import { CoreAccountType, WalletType } from '@avalabs/types'

export const accountSchema = z.object({
  index: z.number(),
  name: z.string(),
  addressBTC: z.string(),
  addressC: z.string(),
  addressAVM: z.string(),
  addressPVM: z.string(),
  addressCoreEth: z.string(),
  active: z.boolean(),
  id: z.string(),
  type: z.nativeEnum(CoreAccountType),
  walletId: z.string().optional(),
  walletType: z.nativeEnum(WalletType).optional()
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
