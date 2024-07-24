import { z } from 'zod'

const requestParamsSchema = z.array(z.number().min(0)).length(4)

export const parseRequestParams = (
  params: unknown
): z.SafeParseReturnType<number[], number[]> => {
  return requestParamsSchema.safeParse(params)
}

export const getCorrectedLimit = (limit: number): number => {
  const MAX_LIMIT = 100
  return limit > MAX_LIMIT ? MAX_LIMIT : limit
}
