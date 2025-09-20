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
  Wallet,
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
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
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
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { Curve, isEvmPublicKey } from 'utils/publicKeys'
import ModuleManager from 'vmModule/ModuleManager'
import {
  getAddressDerivationPath,
  getAssetId,
  isAvalancheTransactionRequest,
  isBtcTransactionRequest,
  isSolanaTransactionRequest,
  MAINNET_AVAX_ASSET_ID,
  TESTNET_AVAX_ASSET_ID
} from './utils'
import WalletFactory from './WalletFactory'
import { MnemonicWallet } from './MnemonicWallet'
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

  public async addAddress({
    walletId,
    walletType,
    accountIndex,
    isTestnet
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    isTestnet: boolean
  }): Promise<Record<NetworkVMType, string>> {
    if (walletType === WalletType.SEEDLESS) {
      const storedPubKeys = await SeedlessPubKeysStorage.retrieve()
      const pubKeys = storedPubKeys.filter(isEvmPublicKey)

      const wallet = await WalletFactory.createWallet({
        walletId,
        walletType
      })

      // create next account only if it doesn't exist yet
      if (!pubKeys[accountIndex]) {
        if (!(wallet instanceof SeedlessWallet)) {
          throw new Error('Expected SeedlessWallet instance')
        }

        // prompt Core Seedless API to derive new keys
        await wallet.addAccount(accountIndex)
      }
    } else if (walletType === WalletType.LEDGER) {
      // For BIP44 Ledger wallets, try to derive addresses from extended public keys
      // This avoids the need to connect to the device for new accounts
      const wallet = await WalletFactory.createWallet({
        walletId,
        walletType
      })

      if (wallet instanceof LedgerWallet && wallet.isBIP44()) {
        // Try to derive addresses from extended public keys
        const evmAddress = wallet.deriveAddressFromXpub(
          accountIndex,
          NetworkVMType.EVM,
          isTestnet
        )
        const btcAddress = wallet.deriveAddressFromXpub(
          accountIndex,
          NetworkVMType.BITCOIN,
          isTestnet
        )

        if (evmAddress && btcAddress) {
          // We can derive EVM and Bitcoin addresses from xpubs
          Logger.info(
            `Derived addresses from xpub for account ${accountIndex}:`,
            {
              evm: evmAddress,
              btc: btcAddress
            }
          )
        }
      }
    }

    const addresses = await this.getAddresses({
      walletId,
      walletType,
      accountIndex,
      isTestnet
    })

    Logger.info(`Final addresses for account ${accountIndex}:`, addresses)
    return addresses
  }

  /**
   * Generates addresses for the given account index and testnet flag.
   */

  public async getAddresses({
    walletId,
    walletType,
    accountIndex,
    isTestnet
  }: {
    walletId: string
    walletType: WalletType
    accountIndex?: number
    isTestnet: boolean
  }): Promise<Record<NetworkVMType, string>> {
    // all vm modules need is just the isTestnet flag
    const network = {
      isTestnet
    } as Network

    return ModuleManager.deriveAddresses({
      walletId,
      walletType,
      accountIndex,
      network
    })
  }

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
    walletType
  }: {
    walletId: string
    walletType: WalletType
  }): Promise<string> {
    if (walletType !== WalletType.MNEMONIC) {
      throw new Error('Unable to get raw xpub XP: unsupported wallet type')
    }

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    if (!(wallet instanceof MnemonicWallet)) {
      throw new Error(
        'Unable to get raw xpub XP: Expected MnemonicWallet instance'
      )
    }

    return wallet.getRawXpubXP()
  }

  public async getAddressesByIndices({
    walletId,
    walletType,
    indices,
    chainAlias,
    isChange,
    isTestnet
  }: {
    walletId: string
    walletType: WalletType
    indices: number[]
    chainAlias: 'X' | 'P'
    isChange: boolean
    isTestnet: boolean
  }): Promise<string[]> {
    if (
      walletType === WalletType.SEEDLESS ||
      walletType === WalletType.PRIVATE_KEY ||
      (isChange && chainAlias !== 'X')
    ) {
      return []
    }

    if (walletType === WalletType.MNEMONIC) {
      const provXP = await NetworkService.getAvalancheProviderXP(isTestnet)

      const xpubXP = await this.getRawXpubXP({ walletId, walletType })

      return xpubXP
        ? indices.map(index => {
            try {
              return Avalanche.getAddressFromXpub(
                xpubXP,
                index,
                provXP,
                chainAlias,
                isChange
              )
            } catch (e) {
              Logger.error('error getting address from xpub', e)
              return ''
            }
          })
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
    walletId,
    walletType,
    accountIndex,
    avaxXPNetwork
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<{
    pChainUtxo: utils.UtxoSet
    cChainUtxo: utils.UtxoSet
  }> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    accountIndex,
    avaxXPNetwork
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<utils.UtxoSet> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
      accountIndex,
      avaxXPNetwork
    )

    return readOnlySigner.getAtomicUTXOs('P', 'C')
  }

  /**
   * Get UTXOs on P-Chain.
   */
  public async getPChainUTXOs({
    walletId,
    walletType,
    accountIndex,
    avaxXPNetwork
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<utils.UtxoSet> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
      accountIndex,
      avaxXPNetwork
    )

    return readOnlySigner.getUTXOs('P')
  }

  public async createExportCTx({
    walletId,
    walletType,
    amountInNAvax,
    baseFeeInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateExportCTxParams & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    accountIndex,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: CreateImportPTxParams & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    amountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState
  }: CreateExportPTxParams & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    amountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationAddress,
    sourceAddress,
    feeState
  }: CreateSendPTxParams & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    amountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationAddress,
    sourceAddress
  }: CreateSendPTxParams & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    accountIndex,
    baseFeeInNAvax,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateImportCTxParams & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
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
  }: AddDelegatorProps & {
    walletId: string
    walletType: WalletType
  }): Promise<UnsignedTx> {
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

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    utxos,
    accountIndex,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    feeState
  }: {
    walletId: string
    walletType: WalletType
    utxos: utils.UtxoSet
    accountIndex: number
    avaxXPNetwork: Network
    sourceChain: 'C' | 'X'
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
  }): Promise<UnsignedTx> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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
    walletId,
    walletType,
    utxos,
    stakeAmountInNAvax,
    accountIndex,
    avaxXPNetwork,
    destinationAddress,
    feeState
  }: {
    walletId: string
    walletType: WalletType
    utxos: utils.UtxoSet
    stakeAmountInNAvax: bigint
    accountIndex: number
    avaxXPNetwork: Network
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
  }): Promise<UnsignedTx> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })
    const readOnlySigner = await this.getReadOnlyAvaSigner(
      wallet,
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

  private async getReadOnlyAvaSigner(
    wallet: Wallet,
    accountIndex: number,
    network: Network
  ): Promise<Avalanche.StaticSigner | Avalanche.WalletVoid> {
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

// Keep as singleton
export default new WalletService()
