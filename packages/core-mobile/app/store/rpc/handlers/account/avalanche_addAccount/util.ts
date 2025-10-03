import { z } from 'zod'

const requestParamsSchema = z.tuple([z.string()]).or(z.tuple([]))

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[string] | [], [string] | []> => {
  return requestParamsSchema.safeParse(params)
}
