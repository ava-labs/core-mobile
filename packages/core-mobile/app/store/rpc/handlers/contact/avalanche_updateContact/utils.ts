import { z } from 'zod'
import { sharedContactWithIdSchema } from '../utils'

const paramsSchema = z.tuple([sharedContactWithIdSchema])

const approveDataSchema = z.object({
  contact: sharedContactWithIdSchema
})

export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
