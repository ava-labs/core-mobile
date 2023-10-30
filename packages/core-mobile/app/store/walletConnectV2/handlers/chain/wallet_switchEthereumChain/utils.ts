import { z } from 'zod'
import { networkSchema } from '../utils'

const paramsSchema = z.tuple([
  z.object({
    chainId: z.string()
  })
])

const approveDataSchema = z.object({
  network: networkSchema
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
