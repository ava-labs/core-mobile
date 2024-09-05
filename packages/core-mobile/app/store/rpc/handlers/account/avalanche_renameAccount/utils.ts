import { z } from 'zod'

const paramsSchema = z.tuple([z.string(), z.string()])

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[string, string], [string, string]> => {
  return paramsSchema.safeParse(params)
}
