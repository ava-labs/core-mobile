import {
  Avalanche,
  BitcoinProviderAbstract,
  BitcoinWallet,
  DerivationPath,
  getAddressDerivationPath,
  getAddressFromXPub,
  getAddressPublicKeyFromXPub,
  getBech32AddressFromXPub,
  getWalletFromMnemonic,
  getXpubFromMnemonic
} from '@avalabs/wallets-sdk'
import { now } from 'moment'
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
import { BaseWallet, JsonRpcProvider } from 'ethers'
import networkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { networks } from 'bitcoinjs-lib'
import {
  personalSign,
  signTypedData,
  SignTypedDataVersion
} from '@metamask/eth-sig-util'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { Account } from 'store/account'
import { RpcMethod } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import { UnsignedTx, utils } from '@avalabs/avalanchejs-v2'
import { fromUnixTime, getUnixTime } from 'date-fns'
import { getMinimumStakeEndTime } from 'services/earn/utils'
import { Avax } from 'types/Avax'
import { bnToBigint } from 'utils/bigNumbers/bnToBigint'
import SeedlessWallet from 'seedless/services/SeedlessWallet'
import { assertNotUndefined } from 'utils/assertions'
import { isAvalancheTransactionRequest, isBtcTransactionRequest } from './utils'

// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

// We increase C chain base fee by 20% for instant speed
const BASE_FEE_MULTIPLIER = 0.2

class WalletService {
  #mnemonic?: string
  /**
   * Derivation path: m/44'/60'/0'
   * @private
   */
  #xpub?: string
  /**
   * Derivation path: m/44'/9000'/0'
   * @private
   */
  #xpubXP?: string

  #walletType?: WalletType

  private get mnemonic(): string {
    assertNotUndefined(this.#mnemonic, 'no mnemonic available')
    return this.#mnemonic
  }

  private set mnemonic(mnemonic: string | undefined) {
    this.#mnemonic = mnemonic
  }

  private get xpub(): string {
    assertNotUndefined(this.#xpub, 'no public key (xpub) available')
    return this.#xpub
  }

  private set xpub(xpub: string | undefined) {
    this.#xpub = xpub
  }

  private get xpubXP(): string {
    assertNotUndefined(this.#xpubXP, 'no public key (xpubXP) available')
    return this.#xpubXP
  }

  private set xpubXP(xpubXP: string | undefined) {
    this.#xpubXP = xpubXP
  }

  private get walletType(): WalletType {
    assertNotUndefined(this.#walletType, 'wallet type is not set')
    return this.#walletType
  }

  private set walletType(walletType: WalletType | undefined) {
    this.#walletType = walletType
  }

  private async mnemonicInit(mnemonic: string): Promise<void> {
    const xpubPromise = getXpubFromMnemonic(mnemonic)
    const xpubXPPromise = new Promise<string>(resolve => {
      resolve(Avalanche.getXpubFromMnemonic(mnemonic))
    })
    const pubKeys = await Promise.allSettled([xpubPromise, xpubXPPromise])
    if (pubKeys[0].status === 'fulfilled') {
      this.xpub = pubKeys[0].value
    }
    if (pubKeys[1].status === 'fulfilled') {
      this.xpubXP = pubKeys[1].value
    }
    this.mnemonic = mnemonic
  }

  private async getBtcWallet(
    accountIndex: number,
    network: Network
  ): Promise<BitcoinWallet> {
    if (network.vmName !== NetworkVMType.BITCOIN) {
      throw new Error('Only Bitcoin networks supported')
    }
    const provider = networkService.getProviderForNetwork(network)

    Logger.info('btcWallet', now())
    const btcWallet = await BitcoinWallet.fromMnemonic(
      this.mnemonic,
      accountIndex,
      provider as BitcoinProviderAbstract
    )
    Logger.info('btcWallet end', now())
    return btcWallet
  }

  private getEvmWallet(accountIndex: number, network: Network): BaseWallet {
    if (network.vmName !== NetworkVMType.EVM) {
      throw new Error('Only EVM networks supported')
    }
    const start = now()

    const wallet = getWalletFromMnemonic(
      this.mnemonic,
      accountIndex,
      DerivationPath.BIP44
    )

    Logger.info('evmWallet getWalletFromMnemonic', now() - start)

    return wallet
  }

  private async getWallet(
    accountIndex: number,
    network: Network,
    sentryTrx?: Transaction
  ): Promise<
    BaseWallet | BitcoinWallet | Avalanche.StaticSigner | SeedlessWallet
  > {
    const provider = networkService.getProviderForNetwork(network)

    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.get_wallet')
      .executeAsync(async () => {
        // Seedless wallet uses a universal signer class (one for all tx types)
        if (this.walletType === WalletType.SEEDLESS) {
          return SeedlessWallet.create(accountIndex)
        }

        if (this.walletType === WalletType.MNEMONIC) {
          switch (network.vmName) {
            // EVM signers
            case NetworkVMType.EVM:
              return this.getEvmWallet(accountIndex, network)
            // Bitcoin signers
            case NetworkVMType.BITCOIN:
              return this.getBtcWallet(accountIndex, network)
            // Avalanche signers
            case NetworkVMType.AVM:
            case NetworkVMType.PVM:
              return Avalanche.StaticSigner.fromMnemonic(
                this.mnemonic,
                getAddressDerivationPath(
                  accountIndex,
                  DerivationPath.BIP44,
                  'AVM'
                ),
                getAddressDerivationPath(
                  accountIndex,
                  DerivationPath.BIP44,
                  'EVM'
                ),
                provider as Avalanche.JsonRpcProvider
              )
            default:
              throw new Error('Unable to get wallet: network not supported')
          }
        }

        throw new Error('Unable to get wallet: unsupported wallet type')
      })
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
    const avalancheProvider = networkService.getProviderForNetwork(
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

  private async getReadOnlyAvaWallet(
    accountIndex: number,
    network: Network
  ): Promise<Avalanche.StaticSigner | Avalanche.WalletVoid> {
    const wallet = await this.getWallet(accountIndex, network)

    if (
      !(wallet instanceof Avalanche.StaticSigner) &&
      !(wallet instanceof SeedlessWallet)
    ) {
      throw new Error('Unable to get read only wallet: invalid wallet instance')
    }

    if (wallet instanceof SeedlessWallet) {
      const provXP = networkService.getAvalancheProviderXP(
        Boolean(network.isTestnet)
      )
      return wallet.getReadOnlyWallet(provXP)
    }

    return wallet
  }

  async init(mnemonic: string, walletType: WalletType): Promise<void> {
    Logger.info(`initializing wallet with type ${walletType}`)

    if (walletType === WalletType.MNEMONIC) {
      await this.mnemonicInit(mnemonic)
    }

    this.walletType = walletType
  }

  async sign(
    tx: SignTransactionRequest,
    accountIndex: number,
    network: Network,
    sentryTrx?: Transaction
  ): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.sign')
      .executeAsync(async () => {
        const wallet = await this.getWallet(accountIndex, network, sentryTrx)

        // handle BTC signing
        if (isBtcTransactionRequest(tx)) {
          if (!(wallet instanceof BitcoinWallet)) {
            throw new Error('Unable to sign transaction: invalid wallet')
          }

          const signedTx = await wallet.signTx(tx.inputs, tx.outputs)
          return signedTx.toHex()
        }
        // Handle Avalanche signing, X/P/CoreEth
        if (isAvalancheTransactionRequest(tx)) {
          if (
            !(wallet instanceof Avalanche.StaticSigner) &&
            !(wallet instanceof SeedlessWallet)
          ) {
            throw new Error('Unable to sign transaction: invalid wallet')
          }

          const txToSign = {
            tx: tx.tx,
            externalIndices: tx.externalIndices,
            internalIndices: tx.internalIndices
          }

          const sig =
            wallet instanceof SeedlessWallet
              ? await wallet.signAvalancheTx(txToSign)
              : await wallet.signTx(txToSign)

          return JSON.stringify(sig.toJSON())
        }

        // handle EVM signing
        if (
          !(wallet instanceof BaseWallet) &&
          !(wallet instanceof SeedlessWallet)
        ) {
          throw new Error('Unable to sign transaction: invalid wallet')
        }

        if (wallet instanceof SeedlessWallet) {
          const provider = networkService.getProviderForNetwork(network)

          if (!(provider instanceof JsonRpcProvider)) {
            throw new Error(
              'Unable to sign transaction: wrong provider obtained for EVM transaction'
            )
          }

          return await wallet.signEvmTx(tx, provider)
        }

        return await wallet.signTransaction(tx)
      })
  }

  async signMessage({
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
    const wallet = await this.getWallet(accountIndex, network)

    if (wallet instanceof SeedlessWallet) {
      return wallet.signMessage({ rpcMethod, data })
    }

    if (!(wallet instanceof BaseWallet)) {
      throw new Error(
        'Unable to sign message: function is not supported on your wallet'
      )
    }

    const privateKey = wallet.privateKey.toLowerCase().startsWith('0x')
      ? wallet.privateKey.slice(2)
      : wallet.privateKey

    const key = Buffer.from(privateKey, 'hex')

    if (!data) {
      throw new Error('no message to sign')
    }

    switch (rpcMethod) {
      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN:
        return personalSign({ privateKey: key, data })
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1: {
        // instances were observed where method was eth_signTypedData or eth_signTypedData_v1,
        // however, payload was V4
        const isV4 =
          typeof data === 'object' && 'types' in data && 'primaryType' in data

        return signTypedData({
          privateKey: key,
          data,
          version: isV4 ? SignTypedDataVersion.V4 : SignTypedDataVersion.V1
        })
      }
      case RpcMethod.SIGN_TYPED_DATA_V3:
        return signTypedData({
          privateKey: key,
          data,
          version: SignTypedDataVersion.V3
        })
      case RpcMethod.SIGN_TYPED_DATA_V4:
        return signTypedData({
          privateKey: key,
          data,
          version: SignTypedDataVersion.V4
        })
      default:
        throw new Error('unknown method')
    }
  }

  getInstantBaseFee(baseFee: Avax): Avax {
    return baseFee.add(baseFee.mul(BASE_FEE_MULTIPLIER))
  }

  async createExportCTx({
    amount,
    baseFee,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateExportCTxParams): Promise<UnsignedTx> {
    const readOnlyWallet = await this.getReadOnlyAvaWallet(
      accountIndex,
      avaxXPNetwork
    )

    const nonce = await readOnlyWallet.getNonce()

    const unsignedTx = readOnlyWallet.exportC(
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

  async createImportPTx({
    accountIndex,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateImportPTxParams): Promise<UnsignedTx> {
    const readOnlyWallet = await this.getReadOnlyAvaWallet(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlyWallet.getAtomicUTXOs('P', sourceChain)

    const unsignedTx = readOnlyWallet.importP(
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
  async createExportPTx({
    amount,
    accountIndex,
    avaxXPNetwork,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateExportPTxParams): Promise<UnsignedTx> {
    const readOnlyWallet = await this.getReadOnlyAvaWallet(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlyWallet.getUTXOs('P')

    const unsignedTx = readOnlyWallet.exportP(
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
  async createImportCTx({
    accountIndex,
    baseFee,
    avaxXPNetwork,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true
  }: CreateImportCTxParams): Promise<UnsignedTx> {
    const readOnlyWallet = await this.getReadOnlyAvaWallet(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlyWallet.getAtomicUTXOs('C', sourceChain)

    const unsignedTx = readOnlyWallet.importC(
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

  async createAddDelegatorTx({
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

    const readOnlyWallet = await this.getReadOnlyAvaWallet(
      accountIndex,
      avaxXPNetwork
    )

    const utxoSet = await readOnlyWallet.getUTXOs('P')
    const config = {
      rewardAddress
    }

    const network = networkService.getAvalancheNetworkXP(isDevMode)

    const unsignedTx = readOnlyWallet.addDelegator(
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

  destroy(): void {
    this.mnemonic = undefined
    this.xpub = undefined
    this.xpubXP = undefined
    this.walletType = undefined
  }

  /**
   * Generates addresses with helpers from wallets-sdk
   * xpub is set at the time the mnemonic is set and is a derived 'read-only' key used for Ledger (not supported)
   * and to derive BTC, EVM addresses
   *
   * @param     accountIndex: number,

   * @param isTestnet
   */
  async getAddresses(
    accountIndex: number,
    isTestnet: boolean
  ): Promise<Record<NetworkVMType, string>> {
    // Avalanche XP Provider
    const provXP = networkService.getAvalancheProviderXP(isTestnet)

    if (this.walletType === WalletType.SEEDLESS) {
      const seedlessWallet = await SeedlessWallet.create(accountIndex)
      return seedlessWallet.getAddresses(isTestnet, provXP)
    }

    if (this.walletType === WalletType.MNEMONIC) {
      // C-avax... this address uses the same public key as EVM
      const cPubKey = getAddressPublicKeyFromXPub(this.xpub, accountIndex)
      const cAddr = provXP.getAddress(cPubKey, 'C')

      // X and P addresses different derivation path m/44'/9000'/0'...
      const xpPub = Avalanche.getAddressPublicKeyFromXpub(
        this.xpubXP,
        accountIndex
      )
      const xAddr = provXP.getAddress(xpPub, 'X')
      const pAddr = provXP.getAddress(xpPub, 'P')

      return {
        [NetworkVMType.EVM]: getAddressFromXPub(this.xpub, accountIndex),
        [NetworkVMType.BITCOIN]: getBech32AddressFromXPub(
          this.xpub,
          accountIndex,
          isTestnet ? networks.testnet : networks.bitcoin
        ),
        [NetworkVMType.AVM]: xAddr,
        [NetworkVMType.PVM]: pAddr,
        [NetworkVMType.CoreEth]: cAddr
      }
    }

    throw new Error('Unable to get addresses: unsupported wallet type')
  }

  /**
   * Get the public key of an account
   * @param account Account to get public key of.
   */
  async getPublicKey(account: Account): Promise<PubKeyType> {
    if (this.walletType === WalletType.SEEDLESS) {
      const seedlessWallet = await SeedlessWallet.create(account.index)
      return seedlessWallet.getPublicKey()
    }

    if (this.walletType === WalletType.MNEMONIC) {
      const evmPub = getAddressPublicKeyFromXPub(this.xpub, account.index)
      const xpPub = Avalanche.getAddressPublicKeyFromXpub(
        this.xpubXP,
        account.index
      )

      return {
        evm: evmPub.toString('hex'),
        xp: xpPub.toString('hex')
      }
    }

    throw new Error('unable to get public key: unsupported wallet type')
  }

  async getAddressesByIndices({
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
      const provXP = await networkService.getAvalancheProviderXP(isTestnet)

      return indices.map(index =>
        Avalanche.getAddressFromXpub(
          this.xpubXP,
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
  async getAtomicUTXOs({
    accountIndex,
    avaxXPNetwork
  }: {
    accountIndex: number
    avaxXPNetwork: Network
  }): Promise<{
    pChainUtxo: utils.UtxoSet
    cChainUtxo: utils.UtxoSet
  }> {
    const readOnlyWallet = await this.getReadOnlyAvaWallet(
      accountIndex,
      avaxXPNetwork
    )

    const pChainUtxo = await readOnlyWallet.getAtomicUTXOs('P', 'C')
    const cChainUtxo = await readOnlyWallet.getAtomicUTXOs('C', 'P')

    return {
      pChainUtxo,
      cChainUtxo
    }
  }
}

export default new WalletService()
