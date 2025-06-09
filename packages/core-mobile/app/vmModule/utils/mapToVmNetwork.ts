import { Network as ChainsSDKNetwork } from '@avalabs/core-chains-sdk'
import { Network as VmModuleNetwork } from '@avalabs/vm-module-types'

export const mapToVmNetwork = (network: ChainsSDKNetwork): VmModuleNetwork => ({
  chainId: network.chainId,
  chainName: network.chainName,
  rpcUrl: network.rpcUrl,
  networkToken: network.networkToken,
  utilityAddresses: network.utilityAddresses,
  logoUri: network.logoUri,
  isTestnet: network.isTestnet,
  explorerUrl: network.explorerUrl,
  caipId: network.caip2Id,
  pricingProviders: {
    coingecko: {
      nativeTokenId: network.pricingProviders?.coingecko.nativeTokenId,
      assetPlatformId: network.pricingProviders?.coingecko.assetPlatformId
    }
  },
  vmName: network.vmName
})
