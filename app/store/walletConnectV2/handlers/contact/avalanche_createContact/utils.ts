import { z } from 'zod'
import { sharedContactWithIdSchema, sharedContactSchema } from '../utils'

const paramsSchema = z.tuple([sharedContactSchema])

const approveDataSchema = z.object({
  contact: sharedContactWithIdSchema
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
