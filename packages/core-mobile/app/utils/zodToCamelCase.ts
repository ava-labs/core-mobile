import z, { ZodEffects } from 'zod'
import camelcaseKeys from 'camelcase-keys'
import { CamelCasedPropertiesDeep } from 'type-fest'

export const zodToCamelCase = <T extends z.ZodTypeAny>(
  zod: T
): ZodEffects<z.ZodTypeAny, CamelCasedPropertiesDeep<T['_output']>> =>
  zod.transform(
    val => camelcaseKeys(val, { deep: true }) as CamelCasedPropertiesDeep<T>
  )
