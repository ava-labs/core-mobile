import { NetworkVMType } from '@avalabs/chains-sdk'
import { object, string, boolean, z } from 'zod'

export type Module = {
  getBalances: () => Promise<string>
  getTransactionHistory: () => Promise<string>
  getNetworkFee: () => Promise<string>
  getAddress: () => Promise<string>
  getVMType: () => NetworkVMType
}

export const SourceSchema = object({
  checksum: string(),
  location: object({
    npm: object({
      filePath: string(),
      packageName: string(),
      registry: string()
    })
  })
})
export type Source = z.infer<typeof SourceSchema>

export const ManifestSchema = object({
  name: string(),
  version: string(),
  description: string(),
  sources: object({
    module: SourceSchema,
    provider: SourceSchema
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

export type Manifest = z.infer<typeof ManifestSchema>
export type Manifests = Record<NetworkVMType, Manifest>
