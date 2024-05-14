import { z } from 'zod'

const paramsSchema = z.union([
  z.tuple([z.string()]).describe('message to sign'),
  z.tuple([
    z.string().describe('message to sign'),
    z.number().nonnegative().describe('account index')
  ])
])

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<[string, number], [string, number] | [string]> => {
  return paramsSchema.safeParse(params)
}
