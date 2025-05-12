import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { CustomNetworkType } from '../hooks/useCustomNetwork'

export function constructCustomNetwork(
  customNetwork: CustomNetworkType,
  isTestnet: boolean
): Network {
  return {
    chainId: Number(customNetwork.chainId),
    chainName: customNetwork.chainName ?? '',
    description: '',
    explorerUrl: customNetwork.explorerUrl ?? '',
    isTestnet,
    logoUri: customNetwork.logoUri ?? '',
    mainnetChainId: 0,
    networkToken: {
      symbol: customNetwork.tokenSymbol ?? '',
      name: customNetwork.tokenName ?? '',
      description: '',
      decimals: 18,
      logoUri: ''
    },
    platformChainId: '',
    rpcUrl: customNetwork.rpcUrl ?? '',
    subnetId: '',
    vmId: '',
    vmName: NetworkVMType.EVM
  }
}
