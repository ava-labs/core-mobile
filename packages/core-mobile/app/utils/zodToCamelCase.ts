import { z } from 'zod'
import camelcaseKeys from 'camelcase-keys'
import type { CamelCasedPropertiesDeep } from 'type-fest'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const zodToCamelCase = <T extends z.ZodTypeAny>(schema: T) =>
  schema.transform(
    val =>
      camelcaseKeys(val as Record<string, unknown>, {
        deep: true
      }) as CamelCasedPropertiesDeep<T['_output']>
  )
