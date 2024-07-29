import { EvmModule } from '@avalabs/evm-module'
import Logger from 'utils/Logger'
import { Environment, Module } from '@avalabs/vm-module-types'
import { NetworkVMType, Network } from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { AvalancheModule } from '@avalabs/avalanche-module'
import { BlockchainId } from '@avalabs/glacier-sdk'
import { BitcoinModule } from '@avalabs/bitcoin-module'
import { BitcoinCaipId } from 'utils/caip2Ids'
import { ModuleErrors, VmModuleErrors } from './errors'
import { approvalController } from './ApprovalController/ApprovalController'

// https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
// Syntax for namespace is defined in CAIP-2
const NAMESPACE_REGEX = new RegExp('[-a-z0-9]{3,8}')

const isDev = typeof __DEV__ === 'boolean' && __DEV__

class ModuleManager {
  #modules: Module[] | undefined

  get avalancheModule(): AvalancheModule {
    return this.#modules?.find(module =>
      module.getManifest()?.network.namespaces.includes('avax')
    ) as AvalancheModule
  }

  get bitcoinModule(): BitcoinModule {
    return this.#modules?.find(module =>
      module.getManifest()?.network.namespaces.includes('bip122')
    ) as BitcoinModule
  }

  constructor() {
    this.init()
  }

  private get modules(): Module[] {
    assertNotUndefined(this.#modules, 'modules are not initialized')
    return this.#modules
  }

  private set modules(modules: Module[]) {
    this.#modules = modules
  }

  init = async (): Promise<void> => {
    if (this.#modules !== undefined) return

    const environment = isDev ? Environment.DEV : Environment.PRODUCTION

    this.modules = [
      new EvmModule({
        environment,
        approvalController
      }),
      new BitcoinModule({ environment }),
      new AvalancheModule({ environment })
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
    switch (network.vmName) {
      case NetworkVMType.BITCOIN:
        return this.getBitcoinBlockchainId(network.vmName, network.isTestnet)
      case NetworkVMType.PVM:
      case NetworkVMType.AVM: {
        return AvalancheModule.getHashedBlockchainId({
          blockchainId: this.getAvalancheBlockchainId(
            network.vmName,
            network.isTestnet
          ),
          isTestnet: network.isTestnet
        })
      }
      case NetworkVMType.EVM:
      case NetworkVMType.CoreEth:
        return `eip155:${network.chainId}`
      default:
        throw new Error('Unsupported network')
    }
  }

  // todo: remove this function once we have blockchainId in Network
  private getAvalancheBlockchainId = (
    vmName: NetworkVMType,
    isTestnet?: boolean
  ): string => {
    if (vmName === NetworkVMType.AVM) {
      return isTestnet
        ? BlockchainId._2JVSBOINJ9C2J33VNTVZ_YT_VJNZD_N2NKIWW_KJCUM_HUWEB5DB_BRM
        : BlockchainId._2O_YMBNV4E_NHYQK2FJJ_V5N_VQLDBTM_NJZQ5S3QS3LO6FTN_C6FBY_M
    }
    return BlockchainId._11111111111111111111111111111111LPO_YY
  }

  // todo: remove this function once we have blockchainId in Network
  private getBitcoinBlockchainId = (
    vmName: NetworkVMType,
    isTestnet?: boolean
  ): string => {
    if (vmName !== NetworkVMType.BITCOIN) {
      throw new Error('Unsupported network')
    }
    return isTestnet
      ? BitcoinCaipId[4503599627370474]
      : BitcoinCaipId[4503599627370475]
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
