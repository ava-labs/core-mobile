import { z } from 'zod'

const paramsSchema = z.union([
  z.tuple([z.string()]),
  z.tuple([z.string(), z.number().nonnegative()])
])

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[string, number], [string, number] | [string]> => {
  return paramsSchema.safeParse(params)
}
