import { AVMModule } from 'vmModule/mock_modules/avm'
import { BitcoinModule } from 'vmModule/mock_modules/bitcoin'
import { CoreEthModule } from 'vmModule/mock_modules/coreEth'
import { EvmModule } from '@avalabs/evm-module'
import { PVMModule } from 'vmModule/mock_modules/pvm'
import Logger from 'utils/Logger'
import { Module } from '@avalabs/vm-module-types'
import { NetworkVMType, Network } from '@avalabs/chains-sdk'
import Config from 'react-native-config'
import { assertNotUndefined } from 'utils/assertions'
import { ModuleErrors, VmModuleErrors } from './errors'
import { approvalController } from './ApprovalController'

if (!Config.GLACIER_URL) throw Error('GLACIER_URL ENV is missing')
if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

if (!Config.PROXY_URL) throw Error('PROXY_URL ENV is missing')

const GLACIER_URL = Config.GLACIER_URL
const GLACIER_API_KEY = Config.GLACIER_API_KEY
const PROXY_URL = Config.PROXY_URL

// https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
// Syntax for namespace is defined in CAIP-2
const NAMESPACE_REGEX = new RegExp('[-a-z0-9]{3,8}')

class ModuleManager {
  #modules: Module[] | undefined

  private get modules(): Module[] {
    assertNotUndefined(this.#modules, 'modules are not initialized')
    return this.#modules
  }

  private set modules(modules: Module[]) {
    this.#modules = modules
  }

  init = async ({
    transactionValidation
  }: {
    transactionValidation: boolean
  }): Promise<void> => {
    if (this.#modules !== undefined) return

    this.modules = [
      new EvmModule({
        glacierApiUrl: GLACIER_URL,
        glacierApiKey: GLACIER_API_KEY,
        proxyApiUrl: PROXY_URL,
        approvalController,
        transactionValidation
      }),
      new BitcoinModule(),
      new AVMModule(),
      new CoreEthModule(),
      new PVMModule()
    ]
  }

  loadModule = async (chainId: string, method?: string): Promise<Module> => {
    const module = await this.getModule(chainId)
    if (module === undefined) {
      throw new VmModuleErrors({
        name: ModuleErrors.UNSUPPORTED_CHAIN_ID,
        message: `No module supported for chainId: ${chainId}`
      })
    }

    if (method && !this.isMethodPermitted(module, method)) {
      throw new VmModuleErrors({
        name: ModuleErrors.UNSUPPORTED_METHOD,
        message: `Method ${method} is not supported in ${
          module.getManifest()?.name
        } module`
      })
    }

    return module
  }

  loadModuleByNetwork = async (
    network: Network,
    method?: string
  ): Promise<Module> => {
    const caip2ChainId = this.convertChainIdToCaip2(network)
    return this.loadModule(caip2ChainId, method)
  }

  convertChainIdToCaip2 = (network: Network): string => {
    const chainId = network.chainId
    switch (network.vmName) {
      case NetworkVMType.BITCOIN:
        return `bip122:${chainId}`
      case NetworkVMType.PVM:
      case NetworkVMType.AVM:
        return `avax:${chainId}`
      case NetworkVMType.EVM:
      case NetworkVMType.CoreEth:
        return `eip155:${chainId}`
      default:
        throw new Error('Unsupported network')
    }
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
    return this.modules.find(module =>
      module.getManifest()?.network.chainIds.includes(chainId)
    )
  }

  private getModuleByNamespace = async (
    namespace: string
  ): Promise<Module | undefined> => {
    return this.modules.find(module =>
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

export default new ModuleManager()
