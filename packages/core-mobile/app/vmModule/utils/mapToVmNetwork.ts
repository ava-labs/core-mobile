import { Network as ChainsSDKNetwork } from '@avalabs/chains-sdk'
import { Network as VmModuleNetwork } from '@avalabs/vm-module-types'

export const mapToVmNetwork = (network: ChainsSDKNetwork): VmModuleNetwork => ({
  chainId: network.chainId,
  chainName: network.chainName,
  rpcUrl: network.rpcUrl,
  networkToken: network.networkToken,
  utilityAddresses: network.utilityAddresses,
  logoUrl: network.logoUri,
  isTestnet: network.isTestnet,
  explorerUrl: network.explorerUrl
})
