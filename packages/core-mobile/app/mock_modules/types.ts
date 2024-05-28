import { object, string, boolean, z } from 'zod'

export type Module = {
  getManifest: () => Manifest | undefined
  getBalances: () => Promise<string>
  getTransactionHistory: () => Promise<string>
  getNetworkFee: () => Promise<string>
  getAddress: () => Promise<string>
}

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
      methods: string()
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
