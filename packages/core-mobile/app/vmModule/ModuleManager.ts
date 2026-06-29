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
import { emptyAddresses } from 'utils/publicKeys'
import { WalletType } from 'services/wallet/types'
import { isUnsupportedXpDerivationError } from 'services/wallet/KeystoneWallet/errors'
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
  }): Promise<(Record<NetworkVMType, string> | undefined)[]> => {
    if (accountIndices.length === 0) return []

    const derivationPathType =
      walletType === WalletType.LEDGER_LIVE
        ? DerivationPath.LedgerLive
        : DerivationPath.BIP44
    const secretId = JSON.stringify({ walletId, walletType })

    // Keystone hardware wallets cannot derive Solana (ED25519) at all, and can
    // only derive Avalanche X/P for the primary account (index 0) — their QR
    // payload carries a single depth-3 account-0 X/P xpub (m/44'/9000'/0').
    // Derive each index independently so those per-account limitations drop only
    // the affected chains for the affected index instead of failing closed for
    // the whole batch. Empty X/P / SVM addresses are handled at the UI layer.
    // See deriveKeystoneAddresses (CP-14303 / CP-14606).
    if (walletType === WalletType.KEYSTONE) {
      return this.deriveKeystoneAddresses({
        secretId,
        accountIndices,
        network,
        derivationPathType
      })
    }

    const perModuleResults = await Promise.allSettled(
      this.modules.map(async module =>
        module.deriveAddresses({
          secretId,
          accountIndices,
          network,
          derivationPathType
        })
      )
    )

    // Each module derives one chain group across *all* indices, so a single
    // rejection means that chain is missing for every index in this batch. We
    // cannot produce a complete address record for any index, so signal the
    // failure with `undefined` slots rather than masking it with empty-string
    // addresses. Callers' `!addresses` guards then engage instead of treating
    // a partially-derived account as valid.
    const rejected = perModuleResults.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    if (rejected.length > 0) {
      rejected.forEach(result => {
        Logger.error('Failed to derive addresses for one or more modules', {
          accountIndices,
          isTestnet: network.isTestnet,
          reason: result.reason
        })
      })
      return accountIndices.map(() => undefined)
    }

    return accountIndices.map((_, i) => {
      let addresses = emptyAddresses()
      perModuleResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const slot = result.value[i]
          if (slot) {
            addresses = { ...addresses, ...slot }
          }
        }
      })
      return addresses
    })
  }

  /**
   * Derive addresses for a Keystone wallet, one account index at a time.
   *
   * Two Keystone-specific limitations are tolerated per index so they don't
   * fail closed the way a genuine error would:
   *  - Solana (ED25519) is never derivable, so the Solana module is excluded.
   *  - Avalanche X/P is only derivable for the primary account (index 0); for
   *    non-primary accounts the Avalanche module rejects with a typed
   *    UNSUPPORTED_XP_DERIVATION error, which we treat as "X/P absent for this
   *    account" and omit (the account is still created from EVM/BTC).
   *
   * Any other rejection still fails closed for that index (returns `undefined`)
   * so a partially-derived account is never persisted. Deriving per index keeps
   * a non-primary X/P rejection from discarding the primary account's X/P when
   * several indices are derived in one batch (e.g. account discovery).
   */
  private deriveKeystoneAddresses = async ({
    secretId,
    accountIndices,
    network,
    derivationPathType
  }: {
    secretId: string
    accountIndices: number[]
    network: Network
    derivationPathType: DerivationPath
  }): Promise<(Record<NetworkVMType, string> | undefined)[]> => {
    const modules = this.modules.filter(
      module =>
        !module
          .getManifest()
          ?.network.namespaces.includes(BlockchainNamespace.SOLANA)
    )

    return Promise.all(
      accountIndices.map(async accountIndex => {
        const perModuleResults = await Promise.allSettled(
          modules.map(async module =>
            module.deriveAddresses({
              secretId,
              accountIndices: [accountIndex],
              network,
              derivationPathType
            })
          )
        )

        let addresses = emptyAddresses()
        for (const result of perModuleResults) {
          if (result.status === 'fulfilled') {
            const slot = result.value[0]
            if (slot) {
              addresses = { ...addresses, ...slot }
            }
            continue
          }

          // Non-primary Keystone accounts simply have no X/P addresses; omit
          // them and keep the account's EVM/BTC addresses.
          if (isUnsupportedXpDerivationError(result.reason)) {
            Logger.info(
              'Keystone non-primary account has no X/P addresses; deriving EVM/BTC only',
              { accountIndex }
            )
            continue
          }

          // Genuine/transient failure — fail closed for this index so a
          // partially derived account is never persisted.
          Logger.error('Failed to derive addresses for one or more modules', {
            accountIndex,
            isTestnet: network.isTestnet,
            reason: result.reason
          })
          return undefined
        }

        return addresses
      })
    )
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
