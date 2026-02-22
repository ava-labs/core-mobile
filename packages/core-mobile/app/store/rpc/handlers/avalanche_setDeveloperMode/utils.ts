import { z } from 'zod'

const requestParamsSchema = z.tuple([z.boolean()])

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseRequestParams = (params: unknown) => {
  return requestParamsSchema.safeParse(params)
}
