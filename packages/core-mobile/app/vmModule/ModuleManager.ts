import { AVMModule } from 'vmModule/mock_modules/avm'
import { BitcoinModule } from 'vmModule/mock_modules/bitcoin'
import { CoreEthModule } from 'vmModule/mock_modules/coreEth'
import { EvmModule } from '@avalabs/evm-module'
import { PVMModule } from 'vmModule/mock_modules/pvm'
import Logger from 'utils/Logger'
import { Module } from '@internal/types'
import { ModuleErrors, VmModuleErrors } from './errors'

const modules: Module[] = [
  new EvmModule(),
  new BitcoinModule(),
  new AVMModule(),
  new CoreEthModule(),
  new PVMModule()
]
// https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
// Syntax for namespace is defined in CAIP-2
const NAMESPACE_REGEX = new RegExp('[-a-z0-9]{3,8}')

export class ModuleManager {
  loadModule = async (chainId: string, method: string): Promise<Module> => {
    const module = await this.getModule(chainId)
    if (module === undefined) {
      throw new VmModuleErrors({
        name: ModuleErrors.UNSUPPORTED_CHAIN_ID,
        message: `No module supported for chainId: ${chainId}`
      })
    }

    if (!this.isMethodPermitted(module, method)) {
      throw new VmModuleErrors({
        name: ModuleErrors.UNSUPPORTED_METHOD,
        message: `Method ${method} is not supported in ${
          module.getManifest()?.name
        } module`
      })
    }

    return module
  }

  private getModule = async (chainId: string): Promise<Module | undefined> => {
    const namespace = chainId.split(':')[0]
    if (!namespace || !NAMESPACE_REGEX.test(namespace)) {
      Logger.error(
        `${ModuleErrors.UNSUPPORTED_NAMESPACE}: namespace is invalid or missing in chainId`
      )
      return
    }

    return (
      (await this.getModuleByChainId(chainId)) ??
      (await this.getModuleByNamespace(namespace))
    )
  }

  private getModuleByChainId = async (
    chainId: string
  ): Promise<Module | undefined> => {
    return modules.find(module =>
      module.getManifest()?.network.chainIds.includes(chainId)
    )
  }

  private getModuleByNamespace = async (
    namespace: string
  ): Promise<Module | undefined> => {
    return modules.find(module =>
      module.getManifest()?.network.namespaces.includes(namespace)
    )
  }

  private isMethodPermitted = (module: Module, method: string): boolean => {
    const methods = module.getManifest()?.permissions.rpc.methods
    if (methods === undefined) {
      return false
    }
    return methods.some(m => {
      if (m === method) {
        return true
      }
      if (m.endsWith('*')) {
        return method.startsWith(m.slice(0, -1))
      }
    })
  }
}
