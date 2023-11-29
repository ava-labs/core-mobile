import {
  Avalanche,
  BlockCypherProvider,
  JsonRpcBatchInternal
} from '@avalabs/wallets-sdk'
import {
  AddDelegatorProps,
  CreateExportCTxParams,
  CreateExportPTxParams,
  CreateImportCTxParams,
  CreateImportPTxParams,
  PubKeyType,
  SignTransactionRequest,
  WalletType
} from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction as SentryTransaction } from '@sentry/types'
import { Account } from 'store/account'
import { RpcMethod } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import { UnsignedTx, utils } from '@avalabs/avalanchejs-v2'
import { fromUnixTime, getUnixTime } from 'date-fns'
import { getMinimumStakeEndTime } from 'services/earn/utils'
import { Avax } from 'types/Avax'
import { bnToBigint } from 'utils/bigNumbers/bnToBigint'
import { assertNotUndefined } from 'utils/assertions'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { isAvalancheTransactionRequest, isBtcTransactionRequest } from './utils'
import WalletInitializer from './WalletInitializer'
import WalletFactory from './WalletFactory'
import MnemonicWalletInstance from './MnemonicWallet'

// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

// We increase C chain base fee by 20% for instant speed
const BASE_FEE_MULTIPLIER = 0.2

class WalletService {
  #walletType?: WalletType

  public async init(mnemonic: string, walletType: WalletType): Promise<void> {
    Logger.info(`initializing wallet with type ${walletType}`)

    await WalletInitializer.initialize({
      mnemonic,
      walletType
    })

    this.walletType = walletType
  }

  public async sign(
    transaction: SignTransactionRequest,
    accountIndex: number,
    network: Network,
    sentryTrx?: SentryTransaction
  ): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.sign')
      .executeAsync(async () => {
        const provider = NetworkService.getProviderForNetwork(network)
        const wallet = await WalletFactory.createWallet(
          accountIndex,
          this.walletType
        )

        if (isBtcTransactionRequest(transaction)) {
          if (!(provider instanceof BlockCypherProvider))
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
      })
  }

  public async signMessage({
    rpcMethod,
    data,
    accountIndex,
    network
  }: {
    rpcMethod: RpcMethod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
    accountIndex: number
    network: Network
  }): Promise<string> {
    const wallet = await WalletFactory.createWallet(
      accountIndex,
      this.walletType
    )
    const provider = NetworkService.getProviderForNetwork(network)

    if (!(provider instanceof JsonRpcBatchInternal))
      throw new Error('Unable to sign message: wrong provider obtained')

    return wallet.signMessage({
      rpcMethod,
      data,
      accountIndex,
      network,
      provider
    })
  }

  public destroy(): void {
    WalletInitializer.terminate(this.walletType).catch(e =>
      Logger.error('unable to destroy wallet', e)
    )
    this.walletType = undefined
  }

  public async addAddress(
    accountIndex: number,
    isTestnet: boolean
  ): Promise<Record<NetworkVMType, string>> {
    if (this.walletType === WalletType.SEEDLESS) {
      const pubKeysStorage = await new SeedlessPubKeysStorage()
      const pubKeys = await pubKeysStorage.retrieve()

      // create next account only if it doesn't exist yet
      if (!pubKeys[accountIndex]) {
        // using the first account here since it always exists
        const wallet = await WalletFactory.createWallet(0, this.walletType)

        if (!(wallet instanceof SeedlessWallet))
          throw new Error('Unable to add address: wrong wallet type')

        // prompt Core Seedless API to derive new keys
        await wallet.addAccount(accountIndex)

        // re-init wallet to fetch new public keys
        await WalletInitializer.initialize({
          walletType: this.walletType
        })
      }
    }

    return this.getAddresses(accountIndex, isTestnet)
  }

  /**
   * Generates addresses for the given account index and testnet flag.
   */
  public async getAddresses(
    accountIndex: number,
    isTestnet: boolean
  ): Promise<Record<NetworkVMType, string>> {
    const wallet = await WalletFactory.createWallet(
      accountIndex,
      this.walletType
    )
    const provXP = NetworkService.getAvalancheProviderXP(isTestnet)

    return await wallet.getAddresses({ accountIndex, isTestnet, provXP })
  }

  /**
   * Get the public key of an account
   * @param account Account to get public key of.
   */
  public async getPublicKey(account: Account): Promise<PubKeyType> {
    const wallet = await WalletFactory.createWallet(
      account.index,
      this.walletType
    )
    return await wallet.getPublicKey(account.index)
  }

  // TODO: use getAddresses instead for staking notification setup logic
  public async getAddressesByIndices({
    indices,
    chainAlias,
    isChange,
    isTestnet
  }: {
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

      return indices.map(index =>
        Avalanche.getAddressFromXpub(
          MnemonicWalletInstance.xpubXP,
          index,
          provXP,
          chainAlias,
          isChange
        )
      )
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

  public getInstantBaseFee(baseFee: Avax): Avax {
    return baseFee.add(baseFee.mul(BASE_FEE_MULTIPLIER))
  }

  public async createExportCTx({
    amount,
    baseFee,
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
      amount.toSubUnit(),
      destinationChain,
      BigInt(nonce),
      bnToBigint(baseFee.toWei()),
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx,
        evmBaseFee: baseFee
      })

    return unsignedTx
  }

  public async createImportPTx({
    accountIndex,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateImportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlySigner.getAtomicUTXOs('P', sourceChain)

    const unsignedTx = readOnlySigner.importP(
      utxoSet,
      sourceChain,
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx
      })

    return unsignedTx
  }

  /**
   * @param amount in nAvax
   * @param accountIndex
   * @param avaxXPNetwork
   * @param destinationChain
   * @param destinationAddress
   */
  public async createExportPTx({
    amount,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateExportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlySigner.getUTXOs('P')

    const unsignedTx = readOnlySigner.exportP(
      amount,
      utxoSet,
      destinationChain,
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx
      })

    return unsignedTx
  }

  /**
   * @param accountIndex
   * @param baseFee
   * @param avaxXPNetwork
   * @param sourceChain
   * @param destinationAddress
   */
  public async createImportCTx({
    accountIndex,
    baseFee,
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
      baseFee.toSubUnit(),
      undefined,
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network: avaxXPNetwork,
        unsignedTx,
        evmBaseFee: baseFee
      })

    return unsignedTx
  }

  public async createAddDelegatorTx({
    accountIndex,
    avaxXPNetwork,
    nodeId,
    stakeAmount,
    startDate,
    endDate,
    rewardAddress,
    isDevMode,
    shouldValidateBurnedAmount = true
  }: AddDelegatorProps): Promise<UnsignedTx> {
    if (!nodeId.startsWith('NodeID-')) {
      throw Error('Invalid node id: ' + nodeId)
    }

    const oneAvax = BigInt(1e9)
    const minStakingAmount = isDevMode ? oneAvax : BigInt(25) * oneAvax
    if (stakeAmount < minStakingAmount) {
      throw Error('Staking amount less than minimum')
    }

    const unixNow = getUnixTime(new Date())
    if (unixNow > startDate) {
      throw Error('Start date must be in future: ' + startDate)
    }

    const minimalStakeEndDate = getMinimumStakeEndTime(
      isDevMode,
      fromUnixTime(startDate)
    )

    if (endDate < getUnixTime(minimalStakeEndDate)) {
      throw Error('Staking duration too short')
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
    const config = {
      rewardAddress
    }

    const network = NetworkService.getAvalancheNetworkXP(isDevMode)

    const unsignedTx = readOnlySigner.addDelegator(
      utxoSet,
      nodeId,
      stakeAmount,
      BigInt(startDate),
      BigInt(endDate),
      config
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network,
        unsignedTx
      })

    return unsignedTx
  }

  // PRIVATE METHODS
  private get walletType(): WalletType {
    assertNotUndefined(this.#walletType, 'wallet type is not set')
    return this.#walletType
  }

  private set walletType(walletType: WalletType | undefined) {
    this.#walletType = walletType
  }

  private validateAvalancheFee({
    network,
    unsignedTx,
    evmBaseFee
  }: {
    network: Network
    unsignedTx: UnsignedTx
    evmBaseFee?: Avax
  }): void {
    if (
      network.vmName !== NetworkVMType.AVM &&
      network.vmName !== NetworkVMType.PVM
    ) {
      throw new Error('Wrong network')
    }

    Logger.info('validating burned amount')
    const avalancheProvider = NetworkService.getProviderForNetwork(
      network
    ) as Avalanche.JsonRpcProvider

    const { isValid, txFee } = utils.validateBurnedAmount({
      unsignedTx,
      context: avalancheProvider.getContext(),
      evmBaseFee: evmBaseFee?.toSubUnit(),
      evmFeeTolerance: EVM_FEE_TOLERANCE
    })

    if (!isValid) {
      Logger.error(`Excessive burn amount. Expected ${txFee} nAvax.`)
      throw Error('Excessive burn amount')
    }

    Logger.info('burned amount is valid')
  }

  private async getReadOnlyAvaSigner(
    accountIndex: number,
    network: Network
  ): Promise<Avalanche.StaticSigner | Avalanche.WalletVoid> {
    const wallet = await WalletFactory.createWallet(
      accountIndex,
      this.walletType
    )
    const provXP = NetworkService.getAvalancheProviderXP(
      Boolean(network.isTestnet)
    )
    return wallet.getReadOnlyAvaSigner({ accountIndex, provXP })
  }
}

export default new WalletService()
