import { avm } from 'mock_modules/avm'
import { bitcoin } from 'mock_modules/bitcoin'
import { coreEth } from 'mock_modules/coreEth'
import { evm } from 'mock_modules/evm'
import { pvm } from 'mock_modules/pvm'
import { Module } from 'mock_modules/types'
import { RpcMethod } from 'store/rpc'
import Logger from 'utils/Logger'

class ModuleManager {
  loadModule = async (
    chainId: string,
    method: string
  ): Promise<Module | undefined> => {
    const module = await this.getModule(chainId)
    if (module === undefined) {
      throw new Error(`No module supported for chainId: ${chainId}`)
    }

    if (!this.isMethodPermitted(module, method)) {
      throw new Error(`Method ${method} is not supported for module ${module}`)
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
    if (evm.getManifest()?.network.chainIds.includes(chainId)) {
      return evm
    }
    if (pvm.getManifest()?.network.chainIds.includes(chainId)) {
      return pvm
    }
    if (avm.getManifest()?.network.chainIds.includes(chainId)) {
      return avm
    }
    if (bitcoin.getManifest()?.network.chainIds.includes(chainId)) {
      return bitcoin
    }
    if (coreEth.getManifest()?.network.chainIds.includes(chainId)) {
      return coreEth
    }
    return undefined
  }

  private getModuleByNamespace = async (
    namespace: string
  ): Promise<Module | undefined> => {
    if (evm.getManifest()?.network.namespaces.includes(namespace)) {
      return evm
    }
    if (pvm.getManifest()?.network.namespaces.includes(namespace)) {
      return pvm
    }
    if (avm.getManifest()?.network.namespaces.includes(namespace)) {
      return avm
    }
    if (bitcoin.getManifest()?.network.namespaces.includes(namespace)) {
      return bitcoin
    }
    if (coreEth.getManifest()?.network.namespaces.includes(namespace)) {
      return coreEth
    }
    return undefined
  }

  private isMethodPermitted = (module: Module, method: string): boolean => {
    return (
      module.getManifest()?.permissions.rpc.methods.includes(method) ?? false
    )
  }
}

export default new ModuleManager()
