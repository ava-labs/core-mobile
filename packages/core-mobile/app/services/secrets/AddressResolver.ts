import { pick } from 'lodash'
import { DerivationPath } from '@avalabs/core-wallets-sdk'
import { Module, NetworkVMType } from '@avalabs/vm-module-types'

import ModuleManager from 'vmModule/ModuleManager'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/core-chains-sdk'
import { getNetworksForAddressDerivation } from 'services/network/utils/getNetworksForAddressDerivation'
import { emptyAddresses, emptyDerivationPaths } from './utils'
import { DerivationPathsMap, DerivationPathsMapKey, PickKeys } from './types'

class AddressResolver {
  async getDerivationPathsByVM<VMs extends (keyof DerivationPathsMap)[]>(
    accountIndex: number,
    derivationPathType: DerivationPath,
    vms: VMs
  ): Promise<PickKeys<DerivationPathsMap, VMs>> {
    const derivationPaths = emptyDerivationPaths()

    for (const module of ModuleManager.modules) {
      const modulePaths = module.buildDerivationPath({
        accountIndex,
        derivationPathType
      })

      for (const [vmType, address] of Object.entries(modulePaths)) {
        derivationPaths[vmType as DerivationPathsMapKey] = address
      }
    }

    return pick(derivationPaths, vms) as PickKeys<DerivationPathsMap, VMs>
  }

  async getAddressesForSecretId({
    secretId,
    isTestnet,
    accountIndex,
    derivationPathType
  }: {
    secretId: string
    isTestnet: boolean
    accountIndex?: number
    derivationPathType?: DerivationPath
  }): Promise<Record<NetworkVMType, string> | never> {
    const addresses = emptyAddresses()

    const networks = getNetworksForAddressDerivation(isTestnet)
    const modules = new Map<Module, Network>()

    for (const network of networks) {
      const module = await ModuleManager.loadModuleByNetwork(network)
      if (module && !modules.has(module)) {
        modules.set(module, network)
      }
    }

    for (const [module, network] of modules.entries()) {
      const moduleAddresses = await module
        .deriveAddress({
          accountIndex,
          network,
          secretId,
          derivationPathType
        })
        .catch(error => {
          Logger.error(
            `Failed to derive address for account ${accountIndex} and ${network.caip2Id}`,
            error
          )

          // We don't want to completely fail the entire method -- we return all the addresses we could.
          // The responsibility for validating the presence of required addresses lies with the caller.
          return {}
        })

      for (const [vmType, address] of Object.entries(moduleAddresses)) {
        addresses[vmType as NetworkVMType] = address
      }
    }

    return addresses
  }
}

export default new AddressResolver()
