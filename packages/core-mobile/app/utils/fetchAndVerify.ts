import z from 'zod'
import type { ZodSchema } from 'zod'

export async function fetchAndVerify<T extends ZodSchema>(
  fetchOptions: Parameters<typeof fetch>,
  schema: T
): Promise<z.infer<T>> {
  const response = await fetch(...fetchOptions)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const responseJson = await response.json()
  return schema.parse(responseJson)
}
