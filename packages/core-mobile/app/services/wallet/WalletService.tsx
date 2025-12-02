import {
  Avalanche,
  BitcoinProvider,
  isSolanaProvider,
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
import { Account } from 'store/account/types'
import Logger from 'utils/Logger'
import { pvm, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { getUnixTime, secondsToMilliseconds } from 'date-fns'
import { getMinimumStakeEndTime } from 'services/earn/utils'
import { PChainId } from '@avalabs/glacier-sdk'
import {
  MessageTypes,
  NetworkVMType,
  RpcMethod,
  TypedData,
  TypedDataV1
} from '@avalabs/vm-module-types'
import { UTCDate } from '@date-fns/utc'
import { nanoToWei } from 'utils/units/converter'
import { SpanName } from 'services/sentry/types'
import { Curve } from 'utils/publicKeys'
import { profileApi } from 'utils/apiClient/profile/profileApi'
import { GetAddressesResponse } from 'utils/apiClient/profile/types'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import {
  getAddressDerivationPath,
  getAvaxAssetId,
  isAvalancheTransactionRequest,
  isBtcTransactionRequest,
  isSolanaTransactionRequest
} from './utils'
import WalletFactory from './WalletFactory'
import { MnemonicWallet } from './MnemonicWallet'
import KeystoneWallet from './KeystoneWallet'
import { LedgerWallet } from './LedgerWallet'

// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

class WalletService {
  public async sign({
    walletId,
    walletType,
    transaction,
    accountIndex,
    network,
    sentrySpanName = 'sign-transaction'
  }: {
    walletId: string
    walletType: WalletType
    transaction: SignTransactionRequest
    accountIndex: number
    network: Network
    sentrySpanName?: SpanName
  }): Promise<string> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.wallet.sign' },
      async () => {
        const provider = await NetworkService.getProviderForNetwork(network)
        const wallet = await WalletFactory.createWallet({
          walletId,
          walletType
        })

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

        if (isSolanaTransactionRequest(transaction)) {
          if (!isSolanaProvider(provider))
            throw new Error(
              'Unable to sign solana transaction: wrong provider obtained'
            )

          return wallet.signSvmTransaction({
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
    walletId,
    walletType,
    rpcMethod,
    data,
    accountIndex,
    network
  }: {
    walletId: string
    walletType: WalletType
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
  }): Promise<string> {
    const provider = await NetworkService.getProviderForNetwork(network)

    if (
      !(provider instanceof JsonRpcBatchInternal) &&
      !(provider instanceof Avalanche.JsonRpcProvider) &&
      !isSolanaProvider(provider)
    )
      throw new Error('Unable to sign message: wrong provider obtained')

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    return wallet.signMessage({
      rpcMethod,
      data,
      accountIndex,
      network,
      provider
    })
  }

  //FIXME: call terminate for seedless
  // public async destroy(): Promise<void> {
  //   await WalletInitializer.terminate(this.walletType).catch(e =>
  //     Logger.error('unable to destroy wallet', e)
  //   )
  //   this.walletType = WalletType.UNSET
  // }

  /**
   * Get the public key of an account
   * @param account Account to get public key of.
   */
  public async getPublicKey(
    walletId: string,
    walletType: WalletType,
    account: Account
  ): Promise<PubKeyType> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const derivationPathEVM = getAddressDerivationPath({
      accountIndex: account.index,
      vmType: NetworkVMType.EVM
    })
    const derivationPathAVM = getAddressDerivationPath({
      accountIndex: account.index,
      vmType: NetworkVMType.AVM
    })

    const evmPublicKey = await wallet.getPublicKeyFor({
      derivationPath: derivationPathEVM,
      curve: Curve.SECP256K1
    })

    const xpPublicKey = await wallet.getPublicKeyFor({
      derivationPath: derivationPathAVM,
      curve: Curve.SECP256K1
    })

    return {
      evm: evmPublicKey,
      xp: xpPublicKey
    }
  }

  public async getPublicKeyFor({
    walletId,
    walletType,
    derivationPath,
    curve
  }: {
    walletId: string
    walletType: WalletType
    derivationPath?: string
    curve: Curve
  }): Promise<string> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    return await wallet.getPublicKeyFor({ derivationPath, curve })
  }

  public async getRawXpubXP({
    walletId,
    walletType,
    accountIndex
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
  }): Promise<string> {
    if (!this.hasXpub(walletType)) {
      throw new Error('Unable to get raw xpub XP: unsupported wallet type')
    }

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    if (
      !(wallet instanceof MnemonicWallet) &&
      !(wallet instanceof KeystoneWallet) &&
      !(wallet instanceof LedgerWallet)
    ) {
      throw new Error(
        'Unable to get raw xpub XP: Expected MnemonicWallet, KeystoneWallet or LedgerWallet instance'
      )
    }

    return wallet.getRawXpubXP(accountIndex)
  }

  // TODO pass correct account index after
  // https://github.com/ava-labs/avalanche-sdks/pull/765/files is merged
  public async getAddressesFromXpubXP({
    walletId,
    walletType,
    accountIndex,
    networkType,
    isTestnet = false,
    onlyWithActivity
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    networkType: NetworkVMType.AVM | NetworkVMType.PVM
    isTestnet: boolean
    onlyWithActivity: boolean
  }): Promise<GetAddressesResponse> {
    const xpubXP = await this.getRawXpubXP({
      walletId,
      walletType,
      accountIndex
    })

    try {
      return await profileApi.postV1getAddresses({
        networkType: networkType,
        extendedPublicKey: xpubXP,
        isTestnet,
        onlyWithActivity
      })
    } catch (err) {
      Logger.error(`[WalletService.ts][getAddressesFromXpubXP]${err}`)
      throw err
    }
  }

  /**
   * Get atomic transactions that are in VM memory.
   */
  public async getAtomicUTXOs({
    account,
    isTestnet
  }: {
    account: Account
    isTestnet: boolean
  }): Promise<{
    pChainUtxo: utils.UtxoSet
    cChainUtxo: utils.UtxoSet
  }> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
    account,
    isTestnet
  }: {
    account: Account
    isTestnet: boolean
  }): Promise<utils.UtxoSet> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

    return readOnlySigner.getAtomicUTXOs('P', 'C')
  }

  /**
   * Get UTXOs on P-Chain.
   */
  public async getPChainUTXOs({
    account,
    isTestnet
  }: {
    account: Account
    isTestnet: boolean
  }): Promise<utils.UtxoSet> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

    return readOnlySigner.getUTXOs('P')
  }

  public async createExportCTx({
    amountInNAvax,
    baseFeeInNAvax,
    account,
    isTestnet,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateExportCTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
        isTestnet,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })

    return unsignedTx
  }

  public async createImportPTx({
    account,
    isTestnet,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: CreateImportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

    const utxoSet = await readOnlySigner.getAtomicUTXOs('P', sourceChain)

    const unsignedTx = readOnlySigner.importP({
      utxoSet,
      sourceChain,
      toAddress: destinationAddress,
      feeState
    })

    shouldValidateBurnedAmount &&
      this.validateAvalancheFee({
        isTestnet,
        unsignedTx
      })

    return unsignedTx
  }

  public async createExportPTx({
    amountInNAvax,
    account,
    isTestnet,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: CreateExportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
        isTestnet,
        unsignedTx
      })

    return unsignedTx
  }

  /**
   * Create UnsignedTx for sending on P-chain
   */
  public async createSendPTx({
    amountInNAvax,
    account,
    isTestnet,
    destinationAddress,
    sourceAddress,
    feeState
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
        [getAvaxAssetId(isTestnet)]: amountInNAvax
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
    account,
    isTestnet,
    destinationAddress,
    sourceAddress
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

    // P-chain has a tx size limit of 64KB
    const utxoSet = await readOnlySigner.getUTXOs('X')
    const changeAddress = utils.parse(sourceAddress)[2]
    return readOnlySigner.baseTX({
      utxoSet,
      chain: 'X',
      toAddress: destinationAddress,
      amountsPerAsset: {
        [getAvaxAssetId(isTestnet)]: amountInNAvax
      },
      options: {
        changeAddresses: [changeAddress]
      }
    })
  }

  public async createImportCTx({
    account,
    baseFeeInNAvax,
    isTestnet,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateImportCTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
        isTestnet,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })

    return unsignedTx
  }

  public async createAddDelegatorTx({
    account,
    isTestnet,
    nodeId,
    stakeAmountInNAvax,
    startDate,
    endDate,
    rewardAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: AddDelegatorProps): Promise<UnsignedTx> {
    if (!nodeId.startsWith('NodeID-')) {
      throw Error('Invalid node id: ' + nodeId)
    }

    const oneAvax = BigInt(1e9)
    const minStakingAmount = isTestnet ? oneAvax : BigInt(25) * oneAvax
    if (stakeAmountInNAvax < minStakingAmount) {
      throw Error('Stake amount less than minimum')
    }

    const unixNow = getUnixTime(new Date())
    if (unixNow > startDate) {
      throw Error('Start date must be in future: ' + startDate)
    }

    const minimalStakeEndDate = getMinimumStakeEndTime(
      isTestnet,
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

    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
        isTestnet,
        unsignedTx
      })

    return unsignedTx
  }

  public async simulateImportPTx({
    utxos,
    account,
    isTestnet,
    sourceChain,
    destinationAddress,
    feeState
  }: {
    utxos: utils.UtxoSet
    account: Account
    isTestnet: boolean
    sourceChain: 'C' | 'X'
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
  }): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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
    account,
    isTestnet,
    destinationAddress,
    feeState
  }: {
    utxos: utils.UtxoSet
    stakeAmountInNAvax: bigint
    account: Account
    isTestnet: boolean
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
  }): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlyAvaSigner(account, isTestnet)

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

  public async getPrivateKeyFromMnemonic(
    mnemonic: string,
    network: Network,
    accountIndex: number
  ): Promise<string> {
    const wallet: MnemonicWallet = new MnemonicWallet(mnemonic)
    const provider = await NetworkService.getProviderForNetwork(network)
    if (!(provider instanceof JsonRpcBatchInternal)) {
      throw new Error('Unable to get signing key: wrong provider obtained')
    }
    const buffer = await wallet.getSigningKey({
      accountIndex,
      network,
      provider
    })
    return '0x' + buffer.toString('hex')
  }

  public hasXpub(walletType: WalletType): boolean {
    return [
      WalletType.MNEMONIC,
      WalletType.KEYSTONE,
      WalletType.LEDGER
    ].includes(walletType)
  }

  private async getReadOnlyAvaSigner(
    account: Account,
    isTestnet: boolean
  ): Promise<Avalanche.AddressWallet> {
    const provXP = await NetworkService.getAvalancheProviderXP(isTestnet)

    return new Avalanche.AddressWallet(
      account.addressC,
      stripAddressPrefix(account.addressCoreEth),
      [stripAddressPrefix(account.addressPVM)],
      stripAddressPrefix(account.addressPVM),
      provXP
    )
  }

  private async validateAvalancheFee({
    isTestnet,
    unsignedTx,
    evmBaseFeeInNAvax
  }: {
    isTestnet: boolean
    unsignedTx: UnsignedTx
    evmBaseFeeInNAvax?: bigint
  }): Promise<void> {
    if (evmBaseFeeInNAvax === undefined) {
      throw new Error('Missing evm fee data')
    }

    Logger.info('validating burned amount')

    const avalancheProvider = await NetworkService.getAvalancheProviderXP(
      isTestnet
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

// Keep as singleton
export default new WalletService()
