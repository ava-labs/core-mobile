import { avm } from 'mock_modules/avm'
import { bitcoin } from 'mock_modules/bitcoin'
import { coreEth } from 'mock_modules/coreEth'
import { evm } from 'mock_modules/evm'
import { pvm } from 'mock_modules/pvm'
import { Module } from 'mock_modules/types'
import Logger from 'utils/Logger'

const modules: Module[] = [evm, pvm, avm, bitcoin, coreEth]

export class ModuleManager {
  loadModule = async (
    chainId: string,
    method: string
  ): Promise<Module | undefined> => {
    const module = await this.getModule(chainId)
    if (module === undefined) {
      throw new Error(`No module supported for chainId: ${chainId}`)
    }

    if (!this.isMethodPermitted(module, method)) {
      throw new Error(
        `Method ${method} is not supported in ${
          module.getManifest()?.name
        } module`
      )
    }

    return module
  }

  private getModule = async (chainId: string): Promise<Module | undefined> => {
    const namespace = chainId.split(':')[0]
    if (namespace === undefined) {
      Logger.error('No namespace found for chainId: ', chainId)
      return undefined
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
