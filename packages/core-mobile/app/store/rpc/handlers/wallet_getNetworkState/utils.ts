import { z } from 'zod'

const requestParamsSchema = z.tuple([z.boolean()])

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[boolean], [boolean]> => {
  return requestParamsSchema.safeParse(params)
}
