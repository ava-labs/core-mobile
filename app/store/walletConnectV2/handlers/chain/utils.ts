import { z } from 'zod'
import { NetworkVMType } from '@avalabs/chains-sdk'

const networkVMTypeSchema = z.nativeEnum(NetworkVMType)

const networkContractTokenResourceLinkSchema = z.object({
  type: z.string(),
  url: z.string()
})

const networkContractTokenSchema = z
  .object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    contractType: z.literal('ERC-20'),
    decimals: z.number(),
    logoUri: z.string().optional(),
    resourceLinks: z.array(networkContractTokenResourceLinkSchema).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    email: z.string().optional()
  })
  .passthrough()

const networkTokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  description: z.string(),
  decimals: z.number(),
  logoUri: z.string()
})

export const networkSchema = z
  .object({
    chainName: z.string(),
    description: z.string().optional(),
    chainId: z.number(),
    platformChainId: z.string().optional(),
    subnetId: z.string().optional(),
    vmId: z.string().optional(),
    vmName: networkVMTypeSchema,
    rpcUrl: z.string(),
    wsUrl: z.string().optional(),
    isTestnet: z.boolean().optional(),
    mainnetChainId: z.number().optional(),
    networkToken: networkTokenSchema,
    logoUri: z.string(),
    tokens: z.array(networkContractTokenSchema).optional(),
    utilityAddresses: z
      .object({
        multicall: z.string()
      })
      .optional(),
    pricingProviders: z
      .object({
        coingecko: z.object({
          assetPlatformId: z.string().optional(),
          nativeTokenId: z.string().optional()
        })
      })
      .optional(),
    explorerUrl: z.string().optional(),
    subnetExplorerUriId: z.string().optional()
  })
  .passthrough()
