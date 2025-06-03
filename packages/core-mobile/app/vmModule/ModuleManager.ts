import { EvmModule } from '@avalabs/evm-module'
import Logger from 'utils/Logger'
import {
  Environment,
  GetAddressParams,
  Module,
  ConstructorParams
} from '@avalabs/vm-module-types'
import {
  NetworkVMType,
  Network,
  BlockchainNamespace
} from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { AvalancheModule } from '@avalabs/avalanche-module'
import { BlockchainId } from '@avalabs/glacier-sdk'
import { BitcoinModule } from '@avalabs/bitcoin-module'
import { SvmModule } from '@avalabs/svm-module'
import {
  getBitcoinCaip2ChainId,
  getEvmCaip2ChainId,
  getSolanaCaip2ChainId
} from 'utils/caip2ChainIds'
import { APPLICATION_NAME, APPLICATION_VERSION } from 'utils/network/constants'
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
      module
        .getManifest()
        ?.network.namespaces.includes(BlockchainNamespace.AVAX)
    ) as AvalancheModule
  }

  get bitcoinModule(): BitcoinModule {
    return this.#modules?.find(module =>
      module
        .getManifest()
        ?.network.namespaces.includes(BlockchainNamespace.BIP122)
    ) as BitcoinModule
  }

  get evmModule(): EvmModule {
    return this.#modules?.find(module =>
      module
        .getManifest()
        ?.network.namespaces.includes(BlockchainNamespace.EIP155)
    ) as EvmModule
  }

  get solanaModule(): SvmModule {
    return this.#modules?.find(module =>
      module
        .getManifest()
        ?.network.namespaces.includes(BlockchainNamespace.SOLANA)
    ) as SvmModule
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

    const moduleInitParams: ConstructorParams = {
      environment,
      approvalController,
      appInfo: {
        name: APPLICATION_NAME,
        version: APPLICATION_VERSION
      }
    }

    this.modules = [
      new EvmModule(moduleInitParams),
      new BitcoinModule(moduleInitParams),
      new AvalancheModule(moduleInitParams),
      new SvmModule(moduleInitParams)
    ]
  }

  /**
   * @param param0 walletType
   * @param param1 accountIndex
   * @param param2 xpub
   * @param param3 xpubXP
   * @param param4 isTestnet
   * @returns EVM, AVM, PVM and Bitcoin addresses
   */
  getAddresses = async ({
    walletType,
    accountIndex,
    xpub,
    xpubXP,
    network
  }: GetAddressParams): Promise<Record<string, string>> => {
    return Promise.allSettled(
      this.modules.map(async module =>
        module.getAddress({
          walletType,
          accountIndex,
          xpub,
          xpubXP,
          network
        })
      )
    ).then(results => {
      let addresses = {}
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          addresses = { ...addresses, ...result.value }
        }
      })
      return addresses
    })
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
      case NetworkVMType.BITCOIN: {
        return getBitcoinCaip2ChainId(!network.isTestnet)
      }
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
        return getEvmCaip2ChainId(network.chainId)
      case NetworkVMType.SVM: {
        const solanaCaip2ChainId = getSolanaCaip2ChainId(network.chainId)
        if (!solanaCaip2ChainId) {
          throw new Error('Unsupported Solana network')
        }
        return solanaCaip2ChainId
      }
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
    if (vmName === NetworkVMType.PVM)
      return BlockchainId._11111111111111111111111111111111LPO_YY

    return isTestnet
      ? BlockchainId.Y_H8D7TH_NJKXMTKUV2JG_BA4P1RN3QPR4P_PR7QYNFCDO_S6K6HWP // c chain for testnet
      : BlockchainId._2Q9E4R6MU3U68N_U1F_YJGB_R6JVWR_RX36COHP_AX5UQXSE55X1Q5 // c chain
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
