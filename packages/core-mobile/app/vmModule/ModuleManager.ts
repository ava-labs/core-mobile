import http from 'http'
import { EvmModule } from '@avalabs/evm-module'
import Logger from 'utils/Logger'
import {
  Environment,
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
import { APPLICATION_NAME, APPLICATION_VERSION } from 'utils/api/constants'
import { DerivationPath } from '@avalabs/core-wallets-sdk'
import { Curve, emptyAddresses } from 'utils/publicKeys'
import { WalletType } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import { getAddressDerivationPath } from 'services/wallet/utils'
import {
  deriveAddressesForAvalanche,
  deriveAddressesForBtc,
  deriveAddressesForEvm,
  deriveAddressesForSvm
} from 'react-native-nitro-avalabs-crypto'
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
      },
      runtime: {
        fetch: global.fetch,
        httpAgent: new http.Agent()
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
   * @param param0 accountIndex
   * @param param1 network
   * @returns EVM, AVM, PVM, SVM and Bitcoin addresses
   */
  deriveAddresses = async ({
    walletId,
    walletType,
    accountIndex,
    network
  }: {
    walletId: string
    walletType: WalletType
    accountIndex?: number
    network: Network
  }): Promise<Record<NetworkVMType, string>> => {
    return Promise.allSettled(
      this.modules.map(async module =>
        module.deriveAddress({
          secretId: JSON.stringify({ walletId, walletType }),
          accountIndex,
          network,
          derivationPathType: DerivationPath.BIP44
        })
      )
    ).then(results => {
      let addresses = emptyAddresses()
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          addresses = { ...addresses, ...result.value }
        }
      })
      return addresses
    })
  }

  /**
   * Batched per-chain address derivation for a list of accountIndices.
   *
   * Mirrors the per-module flow (derivationPath → pubkey via
   * WalletService.getPublicKeyFor → address) but pays the bridge cost once
   * per chain instead of once per chain × accountIndex. EVM/BTC/CoreEth all
   * share the m/44'/60'/… leaf pubkey; AVM/PVM use the m/44'/9000'/… pubkey
   * (CoreEth bech32 is the EVM pubkey under the avax/fuji HRP); SVM uses
   * its own m/44'/501'/… Ed25519 pubkey.
   *
   * Result array is aligned with `accountIndices` and also carries
   * `accountIndex` per entry, so callers can map address ↔ accountIndex
   * either by position or by lookup.
   */
  deriveAllAddresses = async ({
    walletId,
    walletType,
    accountIndices,
    network
  }: {
    walletId: string
    walletType: WalletType
    accountIndices: number[]
    network: Network
  }): Promise<
    Array<{ accountIndex: number; addresses: Record<NetworkVMType, string> }>
  > => {
    if (accountIndices.length === 0) return []

    const isTestnet = network.isTestnet ?? false
    const derivationPathType = DerivationPath.BIP44

    // Step 1 — derivation paths per chain per accountIndex.
    const evmPaths = accountIndices.map(accountIndex =>
      getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.EVM,
        derivationPathType
      })
    )
    const avmPaths = accountIndices.map(accountIndex =>
      getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.AVM,
        derivationPathType
      })
    )
    const svmPaths = accountIndices.map(accountIndex =>
      getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.SVM,
        derivationPathType
      })
    )

    // Step 2 — pubkey fetches. All concurrent; WalletService caches by
    // (walletId, path, curve) so repeat callers hit the warm path.
    const [evmHex, avmHex, svmHex] = await Promise.all([
      Promise.all(
        evmPaths.map(derivationPath =>
          WalletService.getPublicKeyFor({
            walletId,
            walletType,
            derivationPath,
            curve: Curve.SECP256K1
          })
        )
      ),
      Promise.all(
        avmPaths.map(derivationPath =>
          WalletService.getPublicKeyFor({
            walletId,
            walletType,
            derivationPath,
            curve: Curve.SECP256K1
          })
        )
      ),
      Promise.all(
        svmPaths.map(derivationPath =>
          WalletService.getPublicKeyFor({
            walletId,
            walletType,
            derivationPath,
            curve: Curve.ED25519
          })
        )
      )
    ])

    // Step 3 — one native call per chain. Each returns an array aligned
    // with `accountIndices`. The JS wrapper accepts hex pubkeys directly,
    // so we hand the hex strings straight through without an intermediate
    // ArrayBuffer copy.
    const evmAddresses = deriveAddressesForEvm(evmHex)
    const btcAddresses = deriveAddressesForBtc(evmHex, isTestnet)
    const avaxBundles = deriveAddressesForAvalanche(avmHex, evmHex, isTestnet)
    const svmAddresses = deriveAddressesForSvm(svmHex)

    // Step 4 — zip into per-account records keyed by accountIndex.
    return accountIndices.map((accountIndex, i) => ({
      accountIndex,
      addresses: {
        ...emptyAddresses(),
        [NetworkVMType.EVM]: evmAddresses[i] ?? '',
        [NetworkVMType.BITCOIN]: btcAddresses[i] ?? '',
        [NetworkVMType.AVM]: avaxBundles[i]?.x ?? '',
        [NetworkVMType.PVM]: avaxBundles[i]?.p ?? '',
        [NetworkVMType.CoreEth]: avaxBundles[i]?.coreEth ?? '',
        [NetworkVMType.SVM]: svmAddresses[i] ?? ''
      }
    }))
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
      case NetworkVMType.SVM:
        return getSolanaCaip2ChainId(network.chainId)
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
