import {
  Avalanche,
  BitcoinProvider,
  DerivationPath,
  getAddressDerivationPath,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  AddDelegatorProps,
  CreateExportCTxParams,
  CreateExportPTxParams,
  CreateImportCTxParams,
  CreateImportPTxParams,
  CreateSendPTxParams,
  PubKeyType,
  SignTransactionRequest,
  WalletType
} from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import { UnsignedTx, utils, pvm } from '@avalabs/avalanchejs'
import { getUnixTime, secondsToMilliseconds } from 'date-fns'
import { getMinimumStakeEndTime } from 'services/earn/utils'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { PChainId } from '@avalabs/glacier-sdk'
import {
  MessageTypes,
  Module,
  NetworkVMType,
  RpcMethod,
  TypedData,
  TypedDataV1
} from '@avalabs/vm-module-types'
import { UTCDate } from '@date-fns/utc'
import { nanoToWei } from 'utils/units/converter'
import { SpanName } from 'services/sentry/types'
import { Curve, EVM_BASE_DERIVATION_PATH_PREFIX } from 'utils/publicKeys'
import { getNetworksForAddressDerivation } from 'services/network/utils/getNetworksForAddressDerivation'
import { emptyAddresses } from 'utils/publicKeys'
import ModuleManager from 'vmModule/ModuleManager'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { isAvalancheTransactionRequest, isBtcTransactionRequest } from './utils'
import WalletInitializer from './WalletInitializer'
import WalletFactory from './WalletFactory'
import {
  getAssetId,
  TESTNET_AVAX_ASSET_ID,
  MAINNET_AVAX_ASSET_ID
} from './utils'

type InitProps = {
  mnemonic: string
  walletType: WalletType
  isLoggingIn: boolean
}

// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

class WalletService {
  #walletType: WalletType = WalletType.UNSET

  public async init({
    mnemonic,
    isLoggingIn,
    walletType
  }: InitProps): Promise<void> {
    Logger.info(`initializing wallet with type ${walletType}`)

    await WalletInitializer.initialize({
      mnemonic,
      walletType,
      shouldRefreshPublicKeys: isLoggingIn
    })

    this.walletType = walletType
  }

  public async sign({
    transaction,
    accountIndex,
    network,
    sentrySpanName = 'sign-transaction'
  }: {
    transaction: SignTransactionRequest
    accountIndex: number
    network: Network
    sentrySpanName?: SpanName
  }): Promise<string> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.wallet.sign' },
      async () => {
        const provider = await NetworkService.getProviderForNetwork(network)
        const wallet = await WalletFactory.createWallet(this.walletType)

        if (isBtcTransactionRequest(transaction)) {
          if (!(provider instanceof BitcoinProvider))
            throw new Error(
              'Unable to sign btc transaction: wrong provider obtained'
            )

          return wallet.signBtcTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (isAvalancheTransactionRequest(transaction)) {
          if (!(provider instanceof Avalanche.JsonRpcProvider))
            throw new Error(
              'Unable to sign avalanche transaction: wrong provider obtained'
            )

          return wallet.signAvalancheTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (!(provider instanceof JsonRpcBatchInternal))
          throw new Error(
            'Unable to sign evm transaction: wrong provider obtained'
          )

        return wallet.signEvmTransaction({
          accountIndex,
          transaction,
          network,
          provider
        })
      }
    )
  }

  public async signMessage({
    rpcMethod,
    data,
    accountIndex,
    network
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
  }): Promise<string> {
    const wallet = await WalletFactory.createWallet(this.walletType)
    const provider = await NetworkService.getProviderForNetwork(network)

    if (
      !(provider instanceof JsonRpcBatchInternal) &&
      !(provider instanceof Avalanche.JsonRpcProvider)
    )
      throw new Error('Unable to sign message: wrong provider obtained')

    return wallet.signMessage({
      rpcMethod,
      data,
      accountIndex,
      network,
      provider
    })
  }

  public async destroy(): Promise<void> {
    await WalletInitializer.terminate(this.walletType).catch(e =>
      Logger.error('unable to destroy wallet', e)
    )
    this.walletType = WalletType.UNSET
  }

  public async addAddress(
    accountIndex: number,
    isTestnet: boolean
  ): Promise<Record<NetworkVMType, string>> {
    if (this.walletType === WalletType.SEEDLESS) {
      const storedPubKeys = await SeedlessPubKeysStorage.retrieve()
      const pubKeys = storedPubKeys.filter(pubKey =>
        pubKey.derivationPath.startsWith(EVM_BASE_DERIVATION_PATH_PREFIX)
      )

      // create next account only if it doesn't exist yet
      if (!pubKeys[accountIndex]) {
        const wallet = await WalletFactory.createWallet(this.walletType)

        if (!(wallet instanceof SeedlessWallet))
          throw new Error('Unable to add address: wrong wallet type')

        // prompt Core Seedless API to derive new keys
        await wallet.addAccount(accountIndex)

        // re-init wallet to fetch new public keys
        await WalletInitializer.initialize({
          walletType: this.walletType,
          shouldRefreshPublicKeys: true
        })
      }
    }

    return this.getAddresses({
      accountIndex,
      isTestnet
    })
  }

  /**
   * Generates addresses for the given account index and testnet flag.
   */

  public async getAddresses({
    accountIndex,
    isTestnet
  }: {
    accountIndex: number
    isTestnet: boolean
  }): Promise<Record<NetworkVMType, string>> {
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
          secretId: CORE_MOBILE_WALLET_ID,
          derivationPathType: DerivationPath.BIP44
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

  /**
   * Get the public key of an account
   * @param account Account to get public key of.
   */
  public async getPublicKey(accountIndex: number): Promise<PubKeyType> {
    const wallet = await WalletFactory.createWallet(this.walletType)

    const derivationPathEVM = getAddressDerivationPath(
      accountIndex,
      DerivationPath.BIP44,
      'EVM'
    )
    const derivationPathAVM = getAddressDerivationPath(
      accountIndex,
      DerivationPath.BIP44,
      'AVM'
    )

    const evmPublicKey = await wallet.getPublicKeyFor(
      derivationPathEVM,
      'secp256k1'
    )
    const xpPublicKey = await wallet.getPublicKeyFor(
      derivationPathAVM,
      'secp256k1'
    )

    return {
      evm: evmPublicKey,
      xp: xpPublicKey
    }
  }

  public async getPublicKeyFor(
    derivationPath: string,
    curve: Curve
  ): Promise<string> {
    const wallet = await WalletFactory.createWallet(this.walletType)

    return await wallet.getPublicKeyFor(derivationPath, curve)
  }

  // TODO: use getAddresses instead for staking notification setup logic
  public async getAddressesByIndices({
    accountIndex,
    indices,
    chainAlias,
    isChange,
    isTestnet
  }: {
    accountIndex: number
    indices: number[]
    chainAlias: 'X' | 'P'
    isChange: boolean
    isTestnet: boolean
  }): Promise<string[]> {
    if (
      this.walletType === WalletType.SEEDLESS ||
      (isChange && chainAlias !== 'X')
    ) {
      return []
    }

    if (this.walletType === WalletType.MNEMONIC) {
      const provXP = await NetworkService.getAvalancheProviderXP(isTestnet)
      const publicKeys = await this.getPublicKey(accountIndex)
      const xpubXP = publicKeys.xp

      return xpubXP
        ? indices.map(index =>
            Avalanche.getAddressFromXpub(
              xpubXP,
              index,
              provXP,
              chainAlias,
              isChange
            )
          )
        : []
    }

    throw new Error(
      'Unable to get addresses by indices: unsupported wallet type'
    )
  }

  /**
   * Get atomic transactions that are in VM memory.
   */
  public async getAtomicUTXOs({
    accountIndex,
    avaxXPNetwork
  }: {
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<{
    pChainUtxo: utils.UtxoSet
    cChainUtxo: utils.UtxoSet
  }> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const pChainUtxo = await readOnlySigner.getAtomicUTXOs('P', 'C')
    const cChainUtxo = await readOnlySigner.getAtomicUTXOs('C', 'P')

    return {
      pChainUtxo,
      cChainUtxo
    }
  }

  /**
   * Get atomic UTXOs for P-Chain.
   */
  public async getPChainAtomicUTXOs({
    accountIndex,
    avaxXPNetwork
  }: {
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<utils.UtxoSet> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    return readOnlySigner.getAtomicUTXOs('P', 'C')
  }

  /**
   * Get UTXOs on P-Chain.
   */
  public async getPChainUTXOs({
    accountIndex,
    avaxXPNetwork
  }: {
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<utils.UtxoSet> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    return readOnlySigner.getUTXOs('P')
  }

  public async createExportCTx({
    amountInNAvax,
    baseFeeInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateExportCTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const nonce = await readOnlySigner.getNonce()

    const unsignedTx = readOnlySigner.exportC(
      amountInNAvax,
      destinationChain,
      BigInt(nonce),
      nanoToWei(baseFeeInNAvax),
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })

    return unsignedTx
  }

  public async createImportPTx({
    accountIndex,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: CreateImportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlySigner.getAtomicUTXOs('P', sourceChain)

    const unsignedTx = readOnlySigner.importP({
      utxoSet,
      sourceChain,
      toAddress: destinationAddress,
      feeState
    })

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx
      })

    return unsignedTx
  }

  public async createExportPTx({
    amountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: CreateExportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlySigner.getUTXOs('P')

    const unsignedTx = readOnlySigner.exportP({
      amount: amountInNAvax,
      utxoSet,
      destination: destinationChain,
      toAddress: destinationAddress,
      feeState
    })

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx
      })

    return unsignedTx
  }

  /**
   * Create UnsignedTx for sending on P-chain
   */
  public async createSendPTx({
    amountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationAddress,
    sourceAddress,
    feeState
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    // P-chain has a tx size limit of 64KB
    let utxoSet = await readOnlySigner.getUTXOs('P')
    const filteredUtxos = Avalanche.getMaximumUtxoSet({
      wallet: readOnlySigner,
      utxos: utxoSet.getUTXOs(),
      sizeSupportedTx: Avalanche.SizeSupportedTx.BaseP,
      feeState
    })
    utxoSet = new utils.UtxoSet(filteredUtxos)
    const changeAddress = utils.parse(sourceAddress)[2]

    return readOnlySigner.baseTX({
      utxoSet,
      chain: 'P',
      toAddress: destinationAddress,
      amountsPerAsset: {
        [getAssetId(avaxXPNetwork)]: amountInNAvax
      },
      options: {
        changeAddresses: [changeAddress]
      },
      feeState
    })
  }

  /**
   * Create UnsignedTx for sending on X-chain
   */
  public async createSendXTx({
    amountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationAddress,
    sourceAddress
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    // P-chain has a tx size limit of 64KB
    const utxoSet = await readOnlySigner.getUTXOs('X')
    const changeAddress = utils.parse(sourceAddress)[2]
    return readOnlySigner.baseTX({
      utxoSet,
      chain: 'X',
      toAddress: destinationAddress,
      amountsPerAsset: {
        [avaxXPNetwork.isTestnet
          ? TESTNET_AVAX_ASSET_ID
          : MAINNET_AVAX_ASSET_ID]: amountInNAvax
      },
      options: {
        changeAddresses: [changeAddress]
      }
    })
  }

  public async createImportCTx({
    accountIndex,
    baseFeeInNAvax,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateImportCTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlySigner.getAtomicUTXOs('C', sourceChain)

    const unsignedTx = readOnlySigner.importC(
      utxoSet,
      sourceChain,
      baseFeeInNAvax,
      undefined,
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })

    return unsignedTx
  }

  public async createAddDelegatorTx({
    accountIndex,
    avaxXPNetwork,
    nodeId,
    stakeAmountInNAvax,
    startDate,
    endDate,
    rewardAddress,
    isDevMode,
    shouldValidateBurnedAmount = true,
    feeState
  }: AddDelegatorProps): Promise<UnsignedTx> {
    if (!nodeId.startsWith('NodeID-')) {
      throw Error('Invalid node id: ' + nodeId)
    }

    const oneAvax = BigInt(1e9)
    const minStakingAmount = isDevMode ? oneAvax : BigInt(25) * oneAvax
    if (stakeAmountInNAvax < minStakingAmount) {
      throw Error('Stake amount less than minimum')
    }

    const unixNow = getUnixTime(new Date())
    if (unixNow > startDate) {
      throw Error('Start date must be in future: ' + startDate)
    }

    const minimalStakeEndDate = getMinimumStakeEndTime(
      isDevMode,
      new UTCDate(secondsToMilliseconds(startDate))
    )

    if (endDate < getUnixTime(minimalStakeEndDate)) {
      throw Error('Stake duration too short')
    }

    if (
      !rewardAddress.startsWith('P-') ||
      !Avalanche.isBech32Address(rewardAddress, true)
    ) {
      throw Error('Reward address must be from P chain')
    }

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlySigner.getUTXOs('P')

    let unsignedTx

    try {
      unsignedTx = readOnlySigner.addPermissionlessDelegator({
        utxoSet,
        nodeId,
        start: BigInt(startDate),
        end: BigInt(endDate),
        weight: stakeAmountInNAvax,
        subnetId: PChainId._11111111111111111111111111111111LPO_YY,
        rewardAddresses: [rewardAddress],
        feeState
      })
    } catch (error) {
      Logger.warn('unable to create add delegator tx', error)
      // rethrow error
      throw error
    }

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx
      })

    return unsignedTx
  }

  public async simulateImportPTx({
    utxos,
    accountIndex,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    feeState
  }: {
    utxos: utils.UtxoSet
    accountIndex: number
    avaxXPNetwork: Network
    sourceChain: 'C' | 'X'
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
  }): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    return readOnlySigner.importP({
      utxoSet: utxos,
      sourceChain,
      toAddress: destinationAddress,
      feeState
    })
  }

  public async simulateAddPermissionlessDelegatorTx({
    utxos,
    stakeAmountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationAddress,
    feeState
  }: {
    utxos: utils.UtxoSet
    stakeAmountInNAvax: bigint
    accountIndex: number
    avaxXPNetwork: Network
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
  }): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    return readOnlySigner.addPermissionlessDelegator({
      weight: stakeAmountInNAvax,
      nodeId: 'NodeID-1',
      subnetId: PChainId._11111111111111111111111111111111LPO_YY,
      fromAddresses: [destinationAddress ?? ''],
      rewardAddresses: [destinationAddress ?? ''],
      start: BigInt(getUnixTime(new Date())),
      // setting this end date here for this dummy tx is okay. since the end date does not add complexity for this tx, so it doesn't affect the txFee that is returned.
      // get the end date 1 month from now
      end: BigInt(getUnixTime(new Date()) + 60 * 60 * 24 * 30),
      utxoSet: utxos,
      feeState
    })
  }

  public get walletType(): WalletType {
    return this.#walletType
  }

  // PRIVATE METHODS
  private set walletType(walletType: WalletType) {
    this.#walletType = walletType
  }

  private async getReadOnlyAvaSigner(
    accountIndex: number,
    network: Network
  ): Promise<Avalanche.StaticSigner | Avalanche.WalletVoid> {
    const wallet = await WalletFactory.createWallet(this.walletType)
    const provXP = await NetworkService.getAvalancheProviderXP(
      Boolean(network.isTestnet)
    )
    return wallet.getReadOnlyAvaSigner({ accountIndex, provXP })
  }

  private async validateAvalancheFee({
    network,
    unsignedTx,
    evmBaseFeeInNAvax
  }: {
    network: Network
    unsignedTx: UnsignedTx
    evmBaseFeeInNAvax?: bigint
  }): Promise<void> {
    if (
      network.vmName !== NetworkVMType.AVM &&
      network.vmName !== NetworkVMType.PVM
    ) {
      throw new Error('Wrong network')
    }

    if (evmBaseFeeInNAvax === undefined) {
      throw new Error('Missing evm fee data')
    }

    Logger.info('validating burned amount')

    const avalancheProvider = await NetworkService.getAvalancheProviderXP(
      Boolean(network.isTestnet)
    )

    const { isValid, txFee } = utils.validateBurnedAmount({
      unsignedTx,
      context: avalancheProvider.getContext(),
      baseFee: evmBaseFeeInNAvax,
      feeTolerance: EVM_FEE_TOLERANCE
    })

    if (!isValid) {
      Logger.error(`Excessive burn amount. Expected ${txFee} nAvax.`)
      throw Error('Excessive burn amount')
    }

    Logger.info('burned amount is valid')
  }
}

export default new WalletService()
