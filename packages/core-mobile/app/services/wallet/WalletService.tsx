import {
  Avalanche,
  BitcoinProvider,
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
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction as SentryTransaction } from '@sentry/types'
import { Account } from 'store/account/types'
import { RpcMethod } from 'store/rpc/types'
import Logger from 'utils/Logger'
import { UnsignedTx, utils } from '@avalabs/avalanchejs'
import { fromUnixTime, getUnixTime } from 'date-fns'
import { getMinimumStakeEndTime } from 'services/earn/utils'
import { Avax } from 'types/Avax'
import { bnToBigint } from 'utils/bigNumbers/bnToBigint'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { PChainId } from '@avalabs/glacier-sdk'
import { MessageTypes, TypedData, TypedDataV1 } from '@avalabs/vm-module-types'
import { isAvalancheTransactionRequest, isBtcTransactionRequest } from './utils'
import WalletInitializer from './WalletInitializer'
import WalletFactory from './WalletFactory'
import MnemonicWalletInstance from './MnemonicWallet'

type InitProps = {
  mnemonic: string
  walletType: WalletType
  isLoggingIn: boolean
}
// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

// We increase C chain base fee by 20% for instant speed
const BASE_FEE_MULTIPLIER = 0.2

const MAINNET_AVAX_ASSET_ID = Avalanche.MainnetContext.avaxAssetID
const TESTNET_AVAX_ASSET_ID = Avalanche.FujiContext.avaxAssetID

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
      isLoggingIn
    })

    this.walletType = walletType
  }

  public async sign({
    transaction,
    accountIndex,
    network,
    sentryTrx
  }: {
    transaction: SignTransactionRequest
    accountIndex: number
    network: Network
    sentryTrx?: SentryTransaction
  }): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.sign')
      .executeAsync(async () => {
        const provider = await NetworkService.getProviderForNetwork(network)
        const wallet = await WalletFactory.createWallet(
          accountIndex,
          this.walletType
        )

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
      })
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
    const wallet = await WalletFactory.createWallet(
      accountIndex,
      this.walletType
    )
    const provider = NetworkService.getProviderForNetwork(network)

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
      const pubKeysStorage = new SeedlessPubKeysStorage()
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
          walletType: this.walletType,
          isLoggingIn: true
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
    ).catch(reason => {
      Logger.error(reason)
      throw reason
    })

    const provXP = NetworkService.getAvalancheProviderXP(isTestnet)

    return wallet.getAddresses({ accountIndex, isTestnet, provXP })
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
      const provXP = NetworkService.getAvalancheProviderXP(isTestnet)

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
   * Create UnsignedTx for sending on P-chain
   */
  public async createSendPTx({
    amount,
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
    let utxoSet = await readOnlySigner.getUTXOs('P')
    const filteredUtxos = Avalanche.getMaximumUtxoSet(
      readOnlySigner,
      utxoSet.getUTXOs(),
      Avalanche.SizeSupportedTx.BaseP
    )
    utxoSet = new utils.UtxoSet(filteredUtxos)
    const changeAddress = utils.parse(sourceAddress)[2]
    return readOnlySigner.baseTX(
      utxoSet,
      'P',
      destinationAddress,
      {
        [avaxXPNetwork.isTestnet
          ? TESTNET_AVAX_ASSET_ID
          : MAINNET_AVAX_ASSET_ID]: amount.toSubUnit()
      },
      {
        changeAddresses: [changeAddress]
      }
    )
  }

  /**
   * Create UnsignedTx for sending on X-chain
   */
  public async createSendXTx({
    amount,
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
    return readOnlySigner.baseTX(
      utxoSet,
      'X',
      destinationAddress,
      {
        [avaxXPNetwork.isTestnet
          ? TESTNET_AVAX_ASSET_ID
          : MAINNET_AVAX_ASSET_ID]: amount.toSubUnit()
      },
      {
        changeAddresses: [changeAddress]
      }
    )
  }

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
    const network = NetworkService.getAvalancheNetworkP(isDevMode)
    const unsignedTx = readOnlySigner.addPermissionlessDelegator(
      utxoSet,
      nodeId,
      BigInt(startDate),
      BigInt(endDate),
      stakeAmount,
      PChainId._11111111111111111111111111111111LPO_YY,
      undefined,
      [rewardAddress]
    )

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        network,
        unsignedTx
      })

    return unsignedTx
  }

  get walletType(): WalletType {
    return this.#walletType
  }

  // PRIVATE METHODS
  private set walletType(walletType: WalletType) {
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

    const avalancheProvider = NetworkService.getAvalancheProviderXP(
      Boolean(network.isTestnet)
    )

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
