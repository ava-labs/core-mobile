import {
  Avalanche,
  BitcoinProviderAbstract,
  BitcoinWallet,
  DerivationPath,
  getAddressDerivationPath,
  getAddressFromXPub,
  getAddressPublicKeyFromXPub,
  getBech32AddressFromXPub,
  getBtcAddressFromPubKey,
  getEvmAddressFromPubKey,
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
  SignTransactionRequest
} from 'services/wallet/types'
import { BaseWallet } from 'ethers'
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
import SeedlessWallet from 'seedless/SeedlessWallet'

// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

// We increase C chain base fee by 20% for instant speed
const BASE_FEE_MULTIPLIER = 0.2

type MnemonicWalletParams = {
  mnemonic: string
  /**
   * Derivation path: m/44'/60'/0'
   * @private
   */
  xpub?: string
  /**
   * Derivation path: m/44'/9000'/0'
   * @private
   */
  xpubXP?: string
}

type SeedlessWalletParams = {
  pubKeys: PubKeyType[]
}

function isMnemonicWalletParams(
  params: MnemonicWalletParams | SeedlessWalletParams
): params is MnemonicWalletParams {
  return 'mnemonic' in params
}

function isSeedlessWalletParams(
  params: MnemonicWalletParams | SeedlessWalletParams
): params is SeedlessWalletParams {
  return 'pubKeys' in params
}

class WalletService {
  private walletParams?: MnemonicWalletParams | SeedlessWalletParams

  async initWithMenemonic(mnemonic: string): Promise<void> {
    const xpubPromise = getXpubFromMnemonic(mnemonic)
    const xpubXPPromise = new Promise<string>(resolve => {
      resolve(Avalanche.getXpubFromMnemonic(mnemonic))
    })
    this.walletParams = {
      mnemonic
    }
    const pubKeys = await Promise.allSettled([xpubPromise, xpubXPPromise])
    if (pubKeys[0].status === 'fulfilled') {
      this.walletParams.xpub = pubKeys[0].value
    }
    if (pubKeys[1].status === 'fulfilled') {
      this.walletParams.xpubXP = pubKeys[1].value
    }
  }

  async initWithOidcToken(oidcToken: string): Promise<void> {
    await SeedlessWallet.auth(oidcToken)
    const seedlessWallet = new SeedlessWallet()
    await seedlessWallet.connect()
    const pubKeys = await seedlessWallet.getPublicKeys()

    if (!pubKeys) {
      throw new Error('Unable to get pubkey for seedless wallet')
    }

    this.walletParams = {
      pubKeys
    }
  }

  private async getBtcWallet(
    accountIndex: number,
    network: Network
  ): Promise<BitcoinWallet> {
    if (!this.walletParams || !isMnemonicWalletParams(this.walletParams)) {
      throw new Error('not initialized')
    }
    if (network.vmName !== NetworkVMType.BITCOIN) {
      throw new Error('Only Bitcoin networks supported')
    }
    const provider = networkService.getProviderForNetwork(network)

    Logger.info('btcWallet', now())
    const btcWallet = await BitcoinWallet.fromMnemonic(
      this.walletParams.mnemonic,
      accountIndex,
      provider as BitcoinProviderAbstract
    )
    Logger.info('btcWallet end', now())
    return btcWallet
  }

  private getEvmWallet(accountIndex: number, network: Network): BaseWallet {
    if (!this.walletParams || !isMnemonicWalletParams(this.walletParams)) {
      throw new Error('not initialized')
    }
    if (network.vmName !== NetworkVMType.EVM) {
      throw new Error('Only EVM networks supported')
    }
    const start = now()

    const wallet = getWalletFromMnemonic(
      this.walletParams.mnemonic,
      accountIndex,
      DerivationPath.BIP44
    )

    Logger.info('evmWallet getWalletFromMnemonic', now() - start)

    return wallet
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
        if (!wallet) {
          throw new Error('Signing error, wrong network')
        }
        // handle BTC signing
        if ('inputs' in tx) {
          if (!(wallet instanceof BitcoinWallet)) {
            throw new Error('Signing error, wrong network')
          }
          const signedTx = await wallet.signTx(tx.inputs, tx.outputs)
          return signedTx.toHex()
        }
        // Handle Avalanche signing, X/P/CoreEth
        if ('tx' in tx) {
          if (wallet instanceof Avalanche.StaticSigner) {
            const sig = await wallet.signTx({
              tx: tx.tx,
              externalIndices: tx.externalIndices,
              internalIndices: tx.internalIndices
            })

            return JSON.stringify(sig.toJSON())
          }

          if (wallet instanceof SeedlessWallet) {
            const txToSign = {
              tx: tx.tx,
              externalIndices: tx.externalIndices,
              internalIndices: tx.internalIndices
            }

            const result = await wallet.signAvalancheTx(txToSign)

            if (result instanceof UnsignedTx) {
              return JSON.stringify(result.toJSON())
            }

            return result
          }
        }

        if ('to' in tx) {
          return await (wallet as BaseWallet).signTransaction(tx)
        }
        throw new Error('Signing error, invalid data')
      })
  }

  async signMessage(
    rpcMethod: RpcMethod,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    accountIndex: number,
    network: Network
  ): Promise<string | Buffer> {
    const wallet = await this.getWallet(accountIndex, network)
    if (!wallet) {
      throw new Error('wallet undefined in sign tx')
    }

    if (wallet instanceof SeedlessWallet) {
      return await wallet.signMessage(rpcMethod, data, network)
    }

    if (!(wallet instanceof BaseWallet)) {
      throw new Error(`this function not supported on your wallet`)
    }

    const privateKey = wallet.privateKey.toLowerCase().startsWith('0x')
      ? wallet.privateKey.slice(2)
      : wallet.privateKey

    const key = Buffer.from(privateKey, 'hex')

    if (data) {
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
    } else {
      throw new Error('no message to sign')
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
    const wallet = (await this.getWallet(
      accountIndex,
      avaxXPNetwork
    )) as Avalanche.StaticSigner
    const nonce = await wallet.getNonce()

    const unsignedTx = wallet.exportC(
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
    const wallet = (await this.getWallet(
      accountIndex,
      avaxXPNetwork
    )) as Avalanche.StaticSigner

    const utxoSet = await wallet.getAtomicUTXOs('P', sourceChain)

    const unsignedTx = wallet.importP(utxoSet, sourceChain, destinationAddress)

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
    const wallet = (await this.getWallet(
      accountIndex,
      avaxXPNetwork
    )) as Avalanche.StaticSigner

    const utxoSet = await wallet.getUTXOs('P')

    const unsignedTx = wallet.exportP(
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
    const wallet = (await this.getWallet(
      accountIndex,
      avaxXPNetwork
    )) as Avalanche.StaticSigner

    const utxoSet = await wallet.getAtomicUTXOs('C', sourceChain)

    const unsignedTx = wallet.importC(
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

    const wallet = (await this.getWallet(
      accountIndex,
      avaxXPNetwork
    )) as Avalanche.StaticSigner

    const utxoSet = await wallet.getUTXOs('P')
    const config = {
      rewardAddress
    }

    const network = networkService.getAvalancheNetworkXP(isDevMode)

    const unsignedTx = wallet.addDelegator(
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
    this.walletParams = undefined
  }

  /**
   * Generates addresses with helpers from wallets-sdk
   * xpub is set at the time the mnemonic is set and is a derived 'read-only' key used for Ledger (not supported)
   * and to derive BTC, EVM addresses
   *
   * @param index
   * @param isTestnet
   */
  getAddress(index: number, isTestnet: boolean): Record<NetworkVMType, string> {
    if (!this.walletParams) {
      throw new Error('not initialized')
    }

    // Avalanche XP Provider
    const provXP = networkService.getAvalancheProviderXP(isTestnet)

    let xAddr = '',
      pAddr = ''

    if (isMnemonicWalletParams(this.walletParams)) {
      if (!this.walletParams.xpub) {
        throw new Error('No public key available')
      }

      // C-avax... this address uses the same public key as EVM
      const cPubKey = getAddressPublicKeyFromXPub(this.walletParams.xpub, index)
      const cAddr = provXP.getAddress(cPubKey, 'C')

      // We can only get X/P addresses if xpubXP is set
      if (this.walletParams.xpubXP) {
        // X and P addresses different derivation path m/44'/9000'/0'...
        const xpPub = Avalanche.getAddressPublicKeyFromXpub(
          this.walletParams.xpubXP,
          index
        )
        xAddr = provXP.getAddress(xpPub, 'X')
        pAddr = provXP.getAddress(xpPub, 'P')
      }
      return {
        [NetworkVMType.EVM]: getAddressFromXPub(this.walletParams.xpub, index),
        [NetworkVMType.BITCOIN]: getBech32AddressFromXPub(
          this.walletParams.xpub,
          index,
          isTestnet ? networks.testnet : networks.bitcoin
        ),
        [NetworkVMType.AVM]: xAddr,
        [NetworkVMType.PVM]: pAddr,
        [NetworkVMType.CoreEth]: cAddr
      }
    } else if (isSeedlessWalletParams(this.walletParams)) {
      // pubkeys are used for LedgerLive derivation paths m/44'/60'/n'/0/0
      // and for X/P derivation paths  m/44'/9000'/n'/0/0
      const addressPublicKey = this.walletParams.pubKeys[index]

      if (!addressPublicKey?.evm) {
        throw new Error('Account not added')
      }

      const pubKeyBuffer = Buffer.from(addressPublicKey.evm, 'hex')

      // X/P addresses use a different public key because derivation path is different
      if (addressPublicKey.xp) {
        const pubKeyBufferXP = Buffer.from(addressPublicKey.xp, 'hex')
        xAddr = provXP.getAddress(pubKeyBufferXP, 'X')
        pAddr = provXP.getAddress(pubKeyBufferXP, 'P')
      }

      return {
        [NetworkVMType.EVM]: getEvmAddressFromPubKey(pubKeyBuffer),
        [NetworkVMType.BITCOIN]: getBtcAddressFromPubKey(
          pubKeyBuffer,
          isTestnet ? networks.testnet : networks.bitcoin
        ),
        [NetworkVMType.AVM]: xAddr,
        [NetworkVMType.PVM]: pAddr,
        [NetworkVMType.CoreEth]: provXP.getAddress(pubKeyBuffer, 'C')
      }
    }

    throw new Error('Invalid wallet params')
  }

  private async getWallet(
    accountIndex: number,
    network: Network,
    sentryTrx?: Transaction
  ): Promise<
    | BaseWallet
    | BitcoinWallet
    | Avalanche.StaticSigner
    | SeedlessWallet
    | undefined
  > {
    const provider = networkService.getProviderForNetwork(network)
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.get_wallet')
      .executeAsync(async () => {
        if (!this.walletParams) {
          throw new Error('not initialized')
        }

        if (isMnemonicWalletParams(this.walletParams)) {
          switch (network.vmName) {
            case NetworkVMType.EVM:
              return this.getEvmWallet(accountIndex, network)
            case NetworkVMType.BITCOIN:
              return this.getBtcWallet(accountIndex, network)
            case NetworkVMType.AVM:
            case NetworkVMType.PVM:
              return Avalanche.StaticSigner.fromMnemonic(
                this.walletParams.mnemonic ?? '',
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
              return undefined
          }
        } else if (isSeedlessWalletParams(this.walletParams)) {
          const addressPublicKey = this.walletParams.pubKeys?.[accountIndex]
          if (!addressPublicKey) {
            throw new Error('Account public key not available')
          }

          const wallet = new SeedlessWallet(network, addressPublicKey)
          await wallet.connect()
          return wallet
        }
      })
  }

  /**
   * Get the public key of an account
   * @throws Will throw error for LedgerLive accounts that have not been added yet.
   * @param account Account to get public key of.
   */
  async getPublicKey(account: Account): Promise<PubKeyType> {
    if (!this.walletParams) {
      throw new Error('not initialized')
    }

    if (
      isMnemonicWalletParams(this.walletParams) &&
      this.walletParams.xpub &&
      this.walletParams.xpubXP
    ) {
      const evmPub = getAddressPublicKeyFromXPub(
        this.walletParams.xpub,
        account.index
      )
      const xpPub = Avalanche.getAddressPublicKeyFromXpub(
        this.walletParams.xpubXP,
        account.index
      )
      return {
        evm: evmPub.toString('hex'),
        xp: xpPub.toString('hex')
      }
    } else if (isSeedlessWalletParams(this.walletParams)) {
      const pub = this.walletParams.pubKeys[account.index]
      if (!pub) throw new Error('Can not find public key for the given index')
      return {
        evm: pub.evm,
        xp: pub.xp
      }
    } else {
      throw new Error('Can not find public key for the given index')
    }
  }

  async getAddressesByIndices(
    indices: number[],
    chainAlias: 'X' | 'P',
    isChange: boolean,
    isTestnet: boolean
  ): Promise<string[]> {
    if (!this.walletParams) {
      throw new Error('not initialized')
    }

    const provXP = await networkService.getAvalancheProviderXP(isTestnet)

    if (isChange && chainAlias !== 'X') {
      return []
    }

    if (isMnemonicWalletParams(this.walletParams) && this.walletParams.xpubXP) {
      const xpubXP = this.walletParams.xpubXP

      return indices.map(index =>
        Avalanche.getAddressFromXpub(
          xpubXP,
          index,
          provXP,
          chainAlias,
          isChange
        )
      )
    }

    // Seedless Todo: missing implementation?
    throw new Error('getAddressesByIndices: should support seedless wallet')
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
    const wallet = (await this.getWallet(
      accountIndex,
      avaxXPNetwork
    )) as Avalanche.StaticSigner

    const pChainUtxo = await wallet.getAtomicUTXOs('P', 'C')
    const cChainUtxo = await wallet.getAtomicUTXOs('C', 'P')

    return {
      pChainUtxo,
      cChainUtxo
    }
  }
}

export default new WalletService()
