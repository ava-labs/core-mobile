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
import { DerivationPath, getAddressDerivationPath } from '@avalabs/core-wallets-sdk'
import { emptyAddresses, Curve } from 'utils/publicKeys'
import { WalletType } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import {
  deriveAddressesForEvm,
  deriveAddressesForBTC,
  deriveAddressesForAvax,
  deriveAddressesForSVM
} from 'react-native-nitro-avalabs-crypto'
import { ModuleErrors, VmModuleErrors } from './errors'
import { approvalController } from './ApprovalController/ApprovalController'

// https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
// Syntax for namespace is defined in CAIP-2
const NAMESPACE_REGEX = new RegExp('[-a-z0-9]{3,8}')

const hexToUint8 = (input: string): Uint8Array => {
  const h =
    input.startsWith('0x') || input.startsWith('0X') ? input.slice(2) : input
  if (h.length % 2 !== 0) {
    throw new Error('hexToUint8: odd-length hex string')
  }
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

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
   * Batch variant of deriveAddresses. Validates that accountIndices is a
   * consecutive ascending run when length > 1, gathers per-index pubkeys from
   * WalletService, and dispatches the four native batch encoders in parallel.
   * Returns one address record per accountIndex, aligned by position.
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
  }): Promise<Record<NetworkVMType, string>[]> => {
    if (accountIndices.length === 0) return []

    if (accountIndices.length > 1) {
      for (let i = 1; i < accountIndices.length; i++) {
        const prev = accountIndices[i - 1]
        const curr = accountIndices[i]
        if (curr === undefined || prev === undefined || curr !== prev + 1) {
          throw new Error(
            `deriveAllAddresses: accountIndices must be consecutive ascending integers; got gap at position ${i} (${prev} -> ${curr})`
          )
        }
      }
    }

    const pathSpec =
      walletType !== WalletType.LEDGER &&
      walletType !== WalletType.LEDGER_LIVE
        ? undefined
        : walletType === WalletType.LEDGER
        ? DerivationPath.BIP44
        : DerivationPath.LedgerLive

    const pubkeyTriples = await Promise.all(
      accountIndices.map(async accountIndex => {
        // SVM path is positional in the SDK helper (accountIndex, vm, options?).
        // The local services/wallet/utils.ts wrapper takes object args, but
        // importing it here would create a cycle through ModuleManager itself.
        const svmPath = getAddressDerivationPath(
          accountIndex,
          'SVM',
          pathSpec ? { pathSpec } : undefined
        )
        const [{ evm, xp }, svmHex] = await Promise.all([
          WalletService.getPublicKey(walletId, walletType, accountIndex),
          WalletService.getPublicKeyFor({
            walletId,
            walletType,
            derivationPath: svmPath,
            curve: Curve.ED25519
          })
        ])
        return {
          evm: hexToUint8(evm),
          // xp may be absent for wallet types that do not derive an Avalanche
          // pubkey (e.g. some seedless flows). Returning the EVM pubkey here
          // would silently produce wrong-but-valid AVM/PVM/CoreEth bech32
          // strings — match the single-index path's silent-empty contract by
          // signalling the absence with `undefined` and emitting empty strings
          // for AVM/PVM/CoreEth below.
          avax: xp !== undefined ? hexToUint8(xp) : undefined,
          svm: hexToUint8(svmHex)
        }
      })
    )

    // Build per-call inputs. For Avax we drop the indices that have no xp
    // pubkey, then map back to the original positions on the way out.
    const evmPubkeys = pubkeyTriples.map(t => t.evm)
    const svmPubkeys = pubkeyTriples.map(t => t.svm)
    const avaxSlots: Array<{ originalIndex: number; pubkey: Uint8Array }> = []
    pubkeyTriples.forEach((t, i) => {
      if (t.avax !== undefined) {
        avaxSlots.push({ originalIndex: i, pubkey: t.avax })
      }
    })
    const isTestnet = Boolean(network.isTestnet)

    // Native batch encoders are synchronous; the JS-level Promise.all was
    // cosmetic and read as if it parallelized them. Call them in sequence —
    // the per-call C++ parallelFor is where the actual concurrency happens.
    const evmAddrs = deriveAddressesForEvm(evmPubkeys)
    const btcAddrs = deriveAddressesForBTC(evmPubkeys, isTestnet)
    const avaxAddrs =
      avaxSlots.length > 0
        ? deriveAddressesForAvax(
            avaxSlots.map(s => s.pubkey),
            avaxSlots.map(s => evmPubkeys[s.originalIndex] as Uint8Array),
            isTestnet
          )
        : []
    const svmAddrs = deriveAddressesForSVM(svmPubkeys)

    // Re-key Avax results back to the original `accountIndices` positions.
    const avaxByOriginalIndex = new Map<
      number,
      { avm: string; pvm: string; coreEth: string }
    >()
    avaxAddrs.forEach((entry, k) => {
      const slot = avaxSlots[k]
      if (slot && entry) {
        avaxByOriginalIndex.set(slot.originalIndex, entry)
      }
    })

    return accountIndices.map((_, i) => {
      const avax = avaxByOriginalIndex.get(i)
      return {
        [NetworkVMType.EVM]: evmAddrs[i] ?? '',
        [NetworkVMType.BITCOIN]: btcAddrs[i] ?? '',
        [NetworkVMType.AVM]: avax?.avm ?? '',
        [NetworkVMType.PVM]: avax?.pvm ?? '',
        [NetworkVMType.CoreEth]: avax?.coreEth ?? '',
        [NetworkVMType.SVM]: svmAddrs[i] ?? '',
        [NetworkVMType.HVM]: ''
      } as Record<NetworkVMType, string>
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
