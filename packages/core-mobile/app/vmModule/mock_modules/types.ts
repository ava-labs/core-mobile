import { object, string, boolean, z } from 'zod'

const sourceSchema = object({
  checksum: string(),
  location: object({
    npm: object({
      filePath: string(),
      packageName: string(),
      registry: string()
    })
  })
})

const manifestSchema = object({
  name: string(),
  version: string(),
  description: string(),
  sources: object({
    module: sourceSchema,
    provider: sourceSchema.optional()
  }),
  network: object({
    chainIds: string().array(),
    namespaces: string().array()
  }),
  cointype: string(),
  permissions: object({
    rpc: object({
      dapps: boolean(),
      methods: string().array()
    })
  }),
  manifestVersion: string()
})

type Manifest = z.infer<typeof manifestSchema>

export const parseManifest = (
  params: unknown
): z.SafeParseReturnType<unknown, Manifest> => {
  return manifestSchema.safeParse(params)
}
