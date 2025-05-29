import {
  Avalanche,
  BitcoinWallet,
  BitcoinProvider,
  DerivationPath,
  JsonRpcBatchInternal,
  getAddressPublicKeyFromXPub,
  getWalletFromMnemonic,
  getAddressDerivationPath
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
import {
  personalSign,
  signTypedData,
  SignTypedDataVersion
} from '@metamask/eth-sig-util'
import Logger from 'utils/Logger'
import { assertNotUndefined } from 'utils/assertions'
import { utils } from '@avalabs/avalanchejs'
import { toUtf8 } from 'ethereumjs-util'
import { getChainAliasFromNetwork } from 'services/network/utils/getChainAliasFromNetwork'
import {
  TypedDataV1,
  TypedData,
  MessageTypes,
  RpcMethod
} from '@avalabs/vm-module-types'
import { isTypedData } from '@avalabs/evm-module'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export class MnemonicWallet implements Wallet {
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

  private async getBtcSigner(
    accountIndex: number,
    provider: BitcoinProvider
  ): Promise<BitcoinWallet> {
    Logger.info('btcWallet', now())
    const btcWallet = await BitcoinWallet.fromMnemonic(
      this.mnemonic,
      accountIndex,
      provider
    )
    Logger.info('btcWallet end', now())
    return btcWallet
  }

  private getEvmSigner(accountIndex: number): BaseWallet {
    const start = now()

    const wallet = getWalletFromMnemonic(
      this.mnemonic,
      accountIndex,
      DerivationPath.BIP44
    )

    Logger.info('evmWallet getWalletFromMnemonic', now() - start)

    return wallet
  }

  private async getAvaSigner(
    accountIndex: number,
    provider?: Avalanche.JsonRpcProvider
  ): Promise<Avalanche.StaticSigner | Avalanche.SimpleSigner> {
    if (provider) {
      return Avalanche.StaticSigner.fromMnemonic(
        this.mnemonic,
        getAddressDerivationPath(accountIndex, DerivationPath.BIP44, 'AVM'),
        getAddressDerivationPath(accountIndex, DerivationPath.BIP44, 'EVM'),
        provider
      )
    }
    return new Avalanche.SimpleSigner(this.mnemonic, accountIndex)
  }

  private async getSigner({
    accountIndex,
    network,
    provider
  }: {
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal | BitcoinProvider | Avalanche.JsonRpcProvider
  }): Promise<BitcoinWallet | BaseWallet | Avalanche.SimpleSigner> {
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
        return (await this.getAvaSigner(accountIndex)) as Avalanche.SimpleSigner
      default:
        throw new Error('Unable to get signer: network not supported')
    }
  }

  public get mnemonic(): string {
    assertNotUndefined(this.#mnemonic, 'no mnemonic available')
    return this.#mnemonic
  }

  public set mnemonic(mnemonic: string | undefined) {
    this.#mnemonic = mnemonic
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
  public async signMessage({
    rpcMethod,
    data,
    accountIndex,
    network,
    provider
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    switch (rpcMethod) {
      case RpcMethod.AVALANCHE_SIGN_MESSAGE: {
        const chainAlias = getChainAliasFromNetwork(network)
        if (!chainAlias) throw new Error('invalid chain alias')

        return await this.signAvalancheMessage(accountIndex, data, chainAlias)
      }
      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN: {
        if (typeof data !== 'string') throw new Error('data must be string')

        const key = await this.getSigningKey({
          accountIndex,
          network,
          provider
        })
        return personalSign({ privateKey: key, data })
      }
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1: {
        if (typeof data === 'string') throw new Error('data cannot be string')

        // instances were observed where method was eth_signTypedData or eth_signTypedData_v1,
        // however, payload was V4
        const isV4 = isTypedData(data)

        const key = await this.getSigningKey({
          accountIndex,
          network,
          provider
        })
        return signTypedData({
          privateKey: key,
          data,
          version: isV4 ? SignTypedDataVersion.V4 : SignTypedDataVersion.V1
        })
      }
      case RpcMethod.SIGN_TYPED_DATA_V3: {
        if (!isTypedData(data)) throw new Error('invalid typed data')

        const key = await this.getSigningKey({
          accountIndex,
          network,
          provider
        })
        return signTypedData({
          privateKey: key,
          data,
          version: SignTypedDataVersion.V3
        })
      }
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        if (!isTypedData(data)) throw new Error('invalid typed data')

        const key = await this.getSigningKey({
          accountIndex,
          network,
          provider
        })
        return signTypedData({
          privateKey: key,
          data,
          version: SignTypedDataVersion.V4
        })
      }
      default:
        throw new Error('unknown method')
    }
  }

  public async getSigningKey({
    accountIndex,
    network,
    provider
  }: {
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<Buffer> {
    const signer = await this.getSigner({
      accountIndex,
      network,
      provider
    })

    if (!(signer instanceof BaseWallet)) {
      throw new Error(
        'Unable to sign message: function is not supported on wallet'
      )
    }

    const privateKey = signer.privateKey.toLowerCase().startsWith('0x')
      ? signer.privateKey.slice(2)
      : signer.privateKey

    return Buffer.from(privateKey, 'hex')
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
      secretId: accountIndex.toString(),
      accountIndex,
      network: mapToVmNetwork(network),
      derivationPathType: DerivationPath.BIP44
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

  private signAvalancheMessage = async (
    accountIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    chainAlias: Avalanche.ChainIDAlias
  ): Promise<string> => {
    const message = toUtf8(data)
    const signer = (await this.getAvaSigner(
      accountIndex
    )) as Avalanche.SimpleSigner
    const buffer = await signer.signMessage({
      message,
      chain: chainAlias
    })
    return utils.base58check.encode(new Uint8Array(buffer))
  }
}

/**
 * Unlike SeedlessWallet, MnemonicWallet cannot be created on demand
 * as we need the user to enter PIN to decrypt the mnemonic phrase.
 * Thus, we are exporting a single instance of MnemonicWallet
 */
export default new MnemonicWallet()

export class MnemonicWalletFactory {
  //TODO: move to WalletFactory
  public static create(mnemonic: string): MnemonicWallet {
    const newInstance = new MnemonicWallet()
    newInstance.mnemonic = mnemonic
    return newInstance
  }
}
