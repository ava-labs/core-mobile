import {
  Avalanche,
  BitcoinWallet,
  BitcoinProvider,
  DerivationPath,
  JsonRpcBatchInternal,
  getAddressPublicKeyFromXPub,
  getWalletFromMnemonic
} from '@avalabs/core-wallets-sdk'
import { now } from 'moment'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  PubKeyType,
  Wallet
} from 'services/wallet/types'
import { BaseWallet, TransactionRequest } from 'ethers'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import { assertNotUndefined } from 'utils/assertions'
import { WalletType } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'

const throwUnsupportedMethodError = (method: string): never => {
  throw new Error(`Unsupported method: ${method}`)
}

export class KeystoneWallet implements Wallet {
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

  static instance: KeystoneWallet

  public static getInstance(): KeystoneWallet {
    if (!KeystoneWallet.instance) {
      KeystoneWallet.instance = new KeystoneWallet()
    }

    return KeystoneWallet.instance
  }

  private async getBtcSigner(
    accountIndex: number,
    provider: BitcoinProvider
  ): Promise<BitcoinWallet> {
    Logger.info('btcWallet', now())
    const btcWallet = await BitcoinWallet.fromMnemonic(
      '', // this.mnemonic,
      accountIndex,
      provider
    )
    Logger.info('btcWallet end', now())
    return btcWallet
  }

  private getEvmSigner(accountIndex: number): BaseWallet {
    const start = now()

    const wallet = getWalletFromMnemonic(
      '', // this.mnemonic,
      accountIndex,
      DerivationPath.BIP44
    )

    Logger.info('evmWallet getWalletFromMnemonic', now() - start)

    return wallet
  }

  private async getAvaSigner(
    accountIndex: number,
    provider: Avalanche.JsonRpcProvider
  ): Promise<Avalanche.WalletVoid> {
    const keys = await this.getPublicKey(accountIndex)
    return Avalanche.StaticSigner.fromPublicKey(
      Buffer.from(keys.xp!, 'hex'),
      Buffer.from(keys.evm, 'hex'),
      provider
    )
  }

  private async getSigner({
    accountIndex,
    network,
    provider
  }: {
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal | BitcoinProvider | Avalanche.JsonRpcProvider
  }): Promise<
    BitcoinWallet | BaseWallet | Avalanche.SimpleSigner | Avalanche.WalletVoid
  > {
    switch (network.vmName) {
      case NetworkVMType.EVM:
        return this.getEvmSigner(accountIndex)
      case NetworkVMType.BITCOIN:
        if (!(provider instanceof BitcoinProvider)) {
          throw new Error(
            'Unable to get signer: wrong provider obtained for BTC network'
          )
        }
        return this.getBtcSigner(accountIndex, provider)
      case NetworkVMType.AVM:
      case NetworkVMType.PVM:
        if (!(provider instanceof Avalanche.JsonRpcProvider)) {
          throw new Error(
            `Unable to get signer: wrong provider obtained for network ${network.vmName}`
          )
        }
        return (await this.getAvaSigner(
          accountIndex,
          provider
        )) as Avalanche.WalletVoid
      default:
        throw new Error('Unable to get signer: network not supported')
    }
  }

  public get xpub(): string {
    assertNotUndefined(this.#xpub, 'no public key (xpub) available')
    return this.#xpub
  }

  public set xpub(xpub: string | undefined) {
    this.#xpub = xpub
  }

  public get xpubXP(): string {
    assertNotUndefined(this.#xpubXP, 'no public key (xpubXP) available')
    return this.#xpubXP
  }

  public set xpubXP(xpubXP: string | undefined) {
    this.#xpubXP = xpubXP
  }

  /** WALLET INTERFACE IMPLEMENTATION **/
  public async signMessage(): Promise<string> {
    throwUnsupportedMethodError('signMessage')
    return ''
  }

  public async signBtcTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: BtcTransactionRequest
    network: Network
    provider: BitcoinProvider
  }): Promise<string> {
    const signer = await this.getSigner({ accountIndex, network, provider })

    if (!(signer instanceof BitcoinWallet)) {
      throw new Error('Unable to sign btc transaction: invalid signer')
    }

    const signedTx = await signer.signTx(
      transaction.inputs,
      transaction.outputs
    )

    return signedTx.toHex()
  }

  public async signAvalancheTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
    network: Network
    provider: Avalanche.JsonRpcProvider
  }): Promise<string> {
    const signer = await this.getSigner({ accountIndex, network, provider })

    if (!(signer instanceof Avalanche.SimpleSigner)) {
      throw new Error('Unable to sign avalanche transaction: invalid signer')
    }

    const txToSign = {
      tx: transaction.tx,
      externalIndices: transaction.externalIndices,
      internalIndices: transaction.internalIndices
    }

    const sig = await signer.signTx(txToSign)

    return JSON.stringify(sig.toJSON())
  }

  public async signEvmTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: TransactionRequest
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    const signer = await this.getSigner({
      accountIndex,
      network,
      provider
    })

    if (!(signer instanceof BaseWallet)) {
      throw new Error('Unable to sign evm transaction: invalid signer')
    }

    return await signer.signTransaction(transaction)
  }

  public async getPublicKey(accountIndex: number): Promise<PubKeyType> {
    const evmPub = getAddressPublicKeyFromXPub(this.xpub, accountIndex)
    const xpPub = Avalanche.getAddressPublicKeyFromXpub(
      this.xpubXP,
      accountIndex
    )

    return {
      evm: evmPub.toString('hex'),
      xp: xpPub.toString('hex')
    }
  }

  public async getAddresses({
    accountIndex,
    provXP,
    network
  }: {
    accountIndex: number
    provXP: Avalanche.JsonRpcProvider
    network: Network
  }): Promise<Record<NetworkVMType, string>> {
    const addresses = await ModuleManager.getAddresses({
      walletType: WalletType.Keystone,
      accountIndex,
      xpub: this.xpub,
      xpubXP: this.xpubXP,
      network
    })

    // C-avax... this address uses the same public key as EVM
    const cPubKey = getAddressPublicKeyFromXPub(this.xpub, accountIndex)
    const cAddr = provXP.getAddress(cPubKey, 'C')

    return {
      ...(addresses as Record<NetworkVMType, string>),
      [NetworkVMType.CoreEth]: cAddr
    }
  }

  public async getReadOnlyAvaSigner({
    accountIndex,
    provXP
  }: {
    accountIndex: number
    provXP: Avalanche.JsonRpcProvider
  }): Promise<Avalanche.StaticSigner> {
    return (await this.getAvaSigner(
      accountIndex,
      provXP
    )) as Avalanche.StaticSigner
  }
}

export default KeystoneWallet.getInstance()
