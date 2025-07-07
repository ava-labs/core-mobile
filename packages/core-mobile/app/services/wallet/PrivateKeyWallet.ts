import {
  Avalanche,
  BitcoinWallet,
  BitcoinProvider,
  JsonRpcBatchInternal,
  getPublicKeyFromPrivateKey,
  SolanaSigner,
  SolanaProvider
} from '@avalabs/core-wallets-sdk'
import { now } from 'moment'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SolanaTransactionRequest,
  Wallet
} from 'services/wallet/types'
import { BaseWallet, TransactionRequest, Wallet as EthersWallet } from 'ethers'
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
import { strip0x } from '@avalabs/core-utils-sdk/dist'
import { Curve } from 'utils/publicKeys'
import { ed25519 } from '@noble/curves/ed25519'
import { hex } from '@scure/base'

export class PrivateKeyWallet implements Wallet {
  #privateKey?: string

  constructor(privateKey: string) {
    this.#privateKey = privateKey
  }

  private async getBtcSigner(
    provider: BitcoinProvider
  ): Promise<BitcoinWallet> {
    Logger.info('btcWallet', now())
    const btcWallet = new BitcoinWallet(
      Buffer.from(this.privateKey, 'hex'),
      provider
    )
    Logger.info('btcWallet end', now())
    return btcWallet
  }

  private getEvmSigner(provider: JsonRpcBatchInternal): BaseWallet {
    const start = now()

    const wallet = new EthersWallet(this.privateKey, provider)

    Logger.info('evmWallet getWalletFromPrivateKey', now() - start)

    return wallet
  }

  private async getAvaSigner(
    accountIndex: number,
    provider?: Avalanche.JsonRpcProvider
  ): Promise<Avalanche.StaticSigner | Avalanche.SimpleSigner> {
    if (provider) {
      return new Avalanche.StaticSigner(
        Buffer.from(this.privateKey, 'hex'),
        Buffer.from(this.privateKey, 'hex'),
        provider
      )
    }
    return new Avalanche.SimpleSigner(this.privateKey, accountIndex)
  }

  private async getSvmSigner(): Promise<SolanaSigner> {
    return new SolanaSigner(Buffer.from(this.privateKey, 'hex'))
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
    BitcoinWallet | BaseWallet | Avalanche.SimpleSigner | SolanaSigner
  > {
    switch (network.vmName) {
      case NetworkVMType.EVM:
        if (!(provider instanceof JsonRpcBatchInternal)) {
          throw new Error(
            `Unable to get signer: wrong provider obtained for network ${network.vmName}`
          )
        }
        return this.getEvmSigner(provider)
      case NetworkVMType.BITCOIN:
        if (!(provider instanceof BitcoinProvider)) {
          throw new Error(
            'Unable to get signer: wrong provider obtained for BTC network'
          )
        }
        return this.getBtcSigner(provider)
      case NetworkVMType.AVM:
      case NetworkVMType.PVM:
        if (!(provider instanceof Avalanche.JsonRpcProvider)) {
          throw new Error(
            `Unable to get signer: wrong provider obtained for network ${network.vmName}`
          )
        }
        return (await this.getAvaSigner(accountIndex)) as Avalanche.SimpleSigner
      case NetworkVMType.SVM:
        return this.getSvmSigner()
      default:
        throw new Error('Unable to get signer: network not supported')
    }
  }

  public getPublicKeyFor({ curve }: { curve: Curve }): Promise<string> {
    const strippedPk = strip0x(this.privateKey)
    let key: string

    switch (curve) {
      case Curve.SECP256K1: {
        key = hex.encode(new Uint8Array(getPublicKeyFromPrivateKey(strippedPk)))
        break
      }

      case Curve.ED25519: {
        key = hex.encode(ed25519.getPublicKey(strippedPk))
        break
      }

      default:
        throw new Error('Unsupported curve: ' + curve)
    }

    return Promise.resolve(key)
  }
  public get privateKey(): string {
    assertNotUndefined(this.#privateKey, 'no private key available')
    return this.#privateKey
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
    data: string | Uint8Array | TypedDataV1 | TypedData<MessageTypes>
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
          data: data as TypedDataV1 | TypedData<MessageTypes>,
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
          data: data as TypedData<MessageTypes>,
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
          data: data as TypedData<MessageTypes>,
          version: SignTypedDataVersion.V4
        })
      }
      default:
        throw new Error('unknown method')
    }
  }

  private async getSigningKey({
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

  public async signSvmTransaction({
    transaction,
    network: _network,
    provider
  }: {
    accountIndex: number
    transaction: SolanaTransactionRequest
    network: Network
    provider: SolanaProvider
  }): Promise<string> {
    const signer = await this.getSvmSigner()
    return signer.signTx(transaction.serializedTx, provider)
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

  public matchesPrivateKey(privateKey: string): boolean {
    return this.privateKey.toLowerCase() === privateKey.toLowerCase()
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
