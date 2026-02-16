import { z } from 'zod'

const paramsSchema = z.tuple([z.string(), z.string()])

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseRequestParams = (params: unknown) => {
  return paramsSchema.safeParse(params)
}
