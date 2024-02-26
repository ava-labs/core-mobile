import { z } from 'zod'

const paramsSchema = z.tuple([z.boolean()])

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[boolean], [boolean]> => {
  return paramsSchema.safeParse(params)
}
