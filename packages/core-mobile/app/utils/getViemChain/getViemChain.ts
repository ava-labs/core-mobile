import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { Chain } from 'viem'

export const getViemChain = (network: Network): Chain =>
  ({
    name: network.chainName,
    blockExplorers: {
      default: {
        name: network.explorerUrl,
        url: network.explorerUrl
      }
    },
    nativeCurrency: {
      decimals: network.networkToken.decimals,
      symbol: network.networkToken.symbol,
      name: network.networkToken.name
    },
    id: network.chainId,
    contracts:
      network.vmName === NetworkVMType.EVM &&
      network.utilityAddresses?.multicall != null
        ? {
            multicall3: {
              address: network.utilityAddresses.multicall
            }
          }
        : undefined,
    rpcUrls: {
      default: {
        http: [network.rpcUrl]
      }
    },
    testnet: network.isTestnet
  } as Chain)
